use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

const MANAGED_SECTION_START: &str = "# ExecuNow managed start";
const MANAGED_SECTION_END: &str = "# ExecuNow managed end";
const PROVIDER_NAME: &str = "hosts";
const APP_STATE_DIR_NAME: &str = "workspacesexecunowdesktop";
const BLOCKING_STATE_FILE_NAME: &str = "web-blocking-state.json";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct BlockingApplyPayload {
    pub domains: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BlockingApplyResult {
    pub applied: bool,
    pub provider: String,
    pub blocked_domains: Vec<String>,
    pub blocked_hosts: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WebBlockingStatus {
    pub supported: bool,
    pub applied: bool,
    pub provider: String,
    pub blocked_domains: Vec<String>,
    pub blocked_hosts: Vec<String>,
    pub stale: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
struct NativeBlockingState {
    applied: bool,
    domains: Vec<String>,
    updated_at: String,
}

trait BlockingProvider {
    fn apply(&self, domains: &[String]) -> Result<BlockingApplyResult, String>;
    fn clear(&self) -> Result<(), String>;
    fn status(&self) -> Result<WebBlockingStatus, String>;
}

struct HostsProvider;

pub fn maybe_handle_helper_mode() -> Option<i32> {
    let arguments = std::env::args().collect::<Vec<_>>();

    match arguments.as_slice() {
        [_, command, payload_path, result_path] if command == "--execunow-hosts-apply" => {
            Some(run_hosts_apply_helper(payload_path, result_path))
        }
        [_, command] if command == "--execunow-hosts-clear" => Some(run_hosts_clear_helper()),
        _ => None,
    }
}

pub fn apply_web_blocking(domains: Vec<String>) -> Result<BlockingApplyResult, String> {
    #[cfg(windows)]
    {
        let normalized_domains = normalize_domains(&domains);

        if normalized_domains.is_empty() {
            return Ok(BlockingApplyResult {
                applied: false,
                provider: PROVIDER_NAME.to_string(),
                blocked_domains: Vec::new(),
                blocked_hosts: Vec::new(),
            });
        }

        run_elevated_apply_helper(&normalized_domains)
    }

    #[cfg(not(windows))]
    {
        let _ = domains;
        Err("Web blocking via hosts is supported only on Windows in this version.".to_string())
    }
}

pub fn clear_web_blocking() -> Result<(), String> {
    #[cfg(windows)]
    {
        run_elevated_clear_helper()
    }

    #[cfg(not(windows))]
    {
        Ok(())
    }
}

pub fn get_web_blocking_status() -> Result<WebBlockingStatus, String> {
    default_provider().status()
}

pub fn cleanup_stale_web_blocking() -> Result<(), String> {
    #[cfg(windows)]
    {
        let status = default_provider().status()?;

        if status.applied && status.stale {
            run_elevated_clear_helper()?;
        }
    }

    Ok(())
}

fn default_provider() -> HostsProvider {
    HostsProvider
}

#[cfg(not(windows))]
impl BlockingProvider for HostsProvider {
    fn apply(&self, _domains: &[String]) -> Result<BlockingApplyResult, String> {
        Err("Web blocking via hosts is supported only on Windows in this version.".to_string())
    }

    fn clear(&self) -> Result<(), String> {
        Ok(())
    }

    fn status(&self) -> Result<WebBlockingStatus, String> {
        Ok(WebBlockingStatus {
            supported: false,
            applied: false,
            provider: PROVIDER_NAME.to_string(),
            blocked_domains: Vec::new(),
            blocked_hosts: Vec::new(),
            stale: false,
        })
    }
}

#[cfg(windows)]
impl BlockingProvider for HostsProvider {
    fn apply(&self, domains: &[String]) -> Result<BlockingApplyResult, String> {
        let normalized_domains = normalize_domains(domains);
        let blocked_hosts = derive_hosts_from_domains(&normalized_domains);
        let hosts_path = hosts_file_path()?;
        let current_contents = read_text_file(&hosts_path)?;
        let next_contents = build_hosts_file_contents(&current_contents, &blocked_hosts);

        write_text_file(&hosts_path, &next_contents)?;
        write_native_blocking_state(&NativeBlockingState {
            applied: !blocked_hosts.is_empty(),
            domains: normalized_domains.clone(),
            updated_at: current_timestamp(),
        })?;

        Ok(BlockingApplyResult {
            applied: !blocked_hosts.is_empty(),
            provider: PROVIDER_NAME.to_string(),
            blocked_domains: normalized_domains,
            blocked_hosts,
        })
    }

    fn clear(&self) -> Result<(), String> {
        let hosts_path = hosts_file_path()?;
        let current_contents = read_text_file(&hosts_path)?;
        let next_contents = clear_hosts_file_contents(&current_contents);

        write_text_file(&hosts_path, &next_contents)?;
        write_native_blocking_state(&NativeBlockingState {
            applied: false,
            domains: Vec::new(),
            updated_at: current_timestamp(),
        })?;

        Ok(())
    }

    fn status(&self) -> Result<WebBlockingStatus, String> {
        let native_state = read_native_blocking_state().unwrap_or_default();
        let hosts_contents = read_text_file(&hosts_file_path()?)?;
        let applied = has_managed_section(&hosts_contents);
        let blocked_domains = normalize_domains(&native_state.domains);

        Ok(WebBlockingStatus {
            supported: true,
            applied,
            provider: PROVIDER_NAME.to_string(),
            blocked_domains: blocked_domains.clone(),
            blocked_hosts: derive_hosts_from_domains(&blocked_domains),
            stale: applied && native_state.applied,
        })
    }
}

#[cfg(windows)]
fn run_elevated_apply_helper(domains: &[String]) -> Result<BlockingApplyResult, String> {
    let payload_path = unique_temp_path("hosts-apply-payload", "json");
    let result_path = unique_temp_path("hosts-apply-result", "json");

    write_json_file(
        &payload_path,
        &BlockingApplyPayload {
            domains: domains.to_vec(),
        },
    )?;

    let helper_result = run_elevated_helper(&[
        "--execunow-hosts-apply".to_string(),
        payload_path.to_string_lossy().to_string(),
        result_path.to_string_lossy().to_string(),
    ]);

    let result = helper_result.and_then(|_| read_json_file::<BlockingApplyResult>(&result_path));

    let _ = fs::remove_file(&payload_path);
    let _ = fs::remove_file(&result_path);

    result
}

#[cfg(windows)]
fn run_elevated_clear_helper() -> Result<(), String> {
    run_elevated_helper(&["--execunow-hosts-clear".to_string()])
}

#[cfg(windows)]
fn run_elevated_helper(arguments: &[String]) -> Result<(), String> {
    use std::process::Command;

    let executable_path = std::env::current_exe().map_err(|error| {
        format!(
            "ExecuNow could not locate its helper executable: {}",
            error
        )
    })?;
    let script = format!(
        "$process = Start-Process -FilePath '{}' -ArgumentList @({}) -Verb RunAs -Wait -PassThru; exit $process.ExitCode",
        escape_powershell_string(executable_path.to_string_lossy().as_ref()),
        arguments
            .iter()
            .map(|argument| format!("'{}'", escape_powershell_string(argument)))
            .collect::<Vec<_>>()
            .join(", ")
    );
    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .output()
        .map_err(|error| format!("ExecuNow could not request Windows elevation: {}", error))?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if stderr.is_empty() {
        Err("Windows did not allow ExecuNow to update the hosts file.".to_string())
    } else {
        Err(stderr)
    }
}

#[cfg(windows)]
fn run_hosts_apply_helper(payload_path: &str, result_path: &str) -> i32 {
    let payload_result = read_json_file::<BlockingApplyPayload>(Path::new(payload_path))
        .and_then(|payload| default_provider().apply(&payload.domains));

    match payload_result {
        Ok(result) => match write_json_file(Path::new(result_path), &result) {
            Ok(()) => 0,
            Err(error) => {
                eprintln!("{}", error);
                1
            }
        },
        Err(error) => {
            eprintln!("{}", error);
            1
        }
    }
}

#[cfg(not(windows))]
fn run_hosts_apply_helper(_payload_path: &str, _result_path: &str) -> i32 {
    1
}

#[cfg(windows)]
fn run_hosts_clear_helper() -> i32 {
    match default_provider().clear() {
        Ok(()) => 0,
        Err(error) => {
            eprintln!("{}", error);
            1
        }
    }
}

#[cfg(not(windows))]
fn run_hosts_clear_helper() -> i32 {
    0
}

fn normalize_domains(domains: &[String]) -> Vec<String> {
    let mut normalized_domains = Vec::new();

    for domain in domains {
        let trimmed = domain.trim().trim_end_matches('.').to_lowercase();

        if trimmed.is_empty() || !is_valid_hostname(&trimmed) || is_local_or_ip_address(&trimmed) {
            continue;
        }

        if !normalized_domains.iter().any(|existing| existing == &trimmed) {
            normalized_domains.push(trimmed);
        }
    }

    normalized_domains
}

fn derive_hosts_from_domains(domains: &[String]) -> Vec<String> {
    let mut blocked_hosts = Vec::new();

    for domain in normalize_domains(domains) {
        blocked_hosts.push(domain.clone());

        let www_variant = format!("www.{}", domain);

        if !blocked_hosts.iter().any(|existing| existing == &www_variant) {
            blocked_hosts.push(www_variant);
        }
    }

    blocked_hosts
}

fn build_hosts_file_contents(existing_contents: &str, blocked_hosts: &[String]) -> String {
    let cleaned_contents = strip_managed_section(existing_contents);

    if blocked_hosts.is_empty() {
        return trailing_newline(&cleaned_contents);
    }

    let managed_section = render_managed_section(blocked_hosts);

    if cleaned_contents.trim().is_empty() {
        return managed_section;
    }

    format!(
        "{}\r\n\r\n{}",
        cleaned_contents.trim_end_matches(['\r', '\n']),
        managed_section
    )
}

fn clear_hosts_file_contents(existing_contents: &str) -> String {
    trailing_newline(&strip_managed_section(existing_contents))
}

fn render_managed_section(blocked_hosts: &[String]) -> String {
    let mut lines = vec![MANAGED_SECTION_START.to_string()];

    for host in blocked_hosts {
        lines.push(format!("0.0.0.0 {}", host));
        lines.push(format!("::1 {}", host));
    }

    lines.push(MANAGED_SECTION_END.to_string());

    format!("{}\r\n", lines.join("\r\n"))
}

fn strip_managed_section(existing_contents: &str) -> String {
    let mut lines = Vec::new();
    let mut inside_managed_section = false;

    for line in existing_contents.lines() {
        let normalized_line = line.trim_end_matches('\r');

        if normalized_line == MANAGED_SECTION_START {
            inside_managed_section = true;
            continue;
        }

        if normalized_line == MANAGED_SECTION_END {
            inside_managed_section = false;
            continue;
        }

        if !inside_managed_section {
            lines.push(normalized_line.to_string());
        }
    }

    while matches!(lines.last(), Some(last_line) if last_line.is_empty()) {
        lines.pop();
    }

    lines.join("\r\n")
}

fn has_managed_section(existing_contents: &str) -> bool {
    existing_contents.contains(MANAGED_SECTION_START) && existing_contents.contains(MANAGED_SECTION_END)
}

fn trailing_newline(contents: &str) -> String {
    let trimmed = contents.trim_end_matches(['\r', '\n']);

    if trimmed.is_empty() {
        String::new()
    } else {
        format!("{}\r\n", trimmed)
    }
}

fn is_local_or_ip_address(value: &str) -> bool {
    value == "localhost" || is_ipv4_address(value) || is_ipv6_address(value)
}

fn is_ipv4_address(value: &str) -> bool {
    let segments = value.split('.').collect::<Vec<_>>();

    segments.len() == 4
        && segments.iter().all(|segment| {
            segment
                .parse::<u8>()
                .map(|_| segment.chars().all(|character| character.is_ascii_digit()))
                .unwrap_or(false)
        })
}

fn is_ipv6_address(value: &str) -> bool {
    value.contains(':')
}

fn is_valid_hostname(value: &str) -> bool {
    if value.is_empty() || value.len() > 253 || !value.contains('.') {
        return false;
    }

    value.split('.').all(|label| {
        let characters = label.chars().collect::<Vec<_>>();

        if characters.is_empty() || characters.len() > 63 {
            return false;
        }

        if !characters.first().is_some_and(|character| character.is_ascii_alphanumeric())
            || !characters.last().is_some_and(|character| character.is_ascii_alphanumeric())
        {
            return false;
        }

        characters
            .iter()
            .all(|character| character.is_ascii_alphanumeric() || *character == '-')
    })
}

#[cfg(windows)]
fn hosts_file_path() -> Result<PathBuf, String> {
    let system_root = std::env::var_os("SystemRoot")
        .or_else(|| std::env::var_os("WINDIR"))
        .ok_or_else(|| "Windows did not expose the SystemRoot path.".to_string())?;

    Ok(PathBuf::from(system_root)
        .join("System32")
        .join("drivers")
        .join("etc")
        .join("hosts"))
}

#[cfg(windows)]
fn app_state_dir() -> Result<PathBuf, String> {
    let base_dir = std::env::var_os("LOCALAPPDATA")
        .or_else(|| std::env::var_os("APPDATA"))
        .ok_or_else(|| "Windows app data directory is unavailable.".to_string())?;
    let app_state_dir = PathBuf::from(base_dir).join(APP_STATE_DIR_NAME);

    fs::create_dir_all(&app_state_dir)
        .map_err(|error| format!("ExecuNow could not prepare its app data directory: {}", error))?;

    Ok(app_state_dir)
}

#[cfg(windows)]
fn native_blocking_state_path() -> Result<PathBuf, String> {
    Ok(app_state_dir()?.join(BLOCKING_STATE_FILE_NAME))
}

#[cfg(windows)]
fn read_native_blocking_state() -> Result<NativeBlockingState, String> {
    let state_path = native_blocking_state_path()?;

    if !state_path.exists() {
        return Ok(NativeBlockingState::default());
    }

    read_json_file(&state_path)
}

#[cfg(windows)]
fn write_native_blocking_state(state: &NativeBlockingState) -> Result<(), String> {
    write_json_file(&native_blocking_state_path()?, state)
}

#[cfg(windows)]
fn unique_temp_path(prefix: &str, extension: &str) -> PathBuf {
    let epoch_millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    std::env::temp_dir().join(format!(
        "execunow-{}-{}-{}.{}",
        prefix,
        std::process::id(),
        epoch_millis,
        extension
    ))
}

#[cfg(windows)]
fn escape_powershell_string(value: &str) -> String {
    value.replace('\'', "''")
}

#[cfg(windows)]
fn current_timestamp() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string()
}

#[cfg(windows)]
fn read_text_file(path: &Path) -> Result<String, String> {
    match fs::read_to_string(path) {
        Ok(contents) => Ok(contents),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
        Err(error) => Err(format!(
            "ExecuNow could not read {}: {}",
            path.display(),
            error
        )),
    }
}

#[cfg(windows)]
fn write_text_file(path: &Path, contents: &str) -> Result<(), String> {
    fs::write(path, contents)
        .map_err(|error| format!("ExecuNow could not write {}: {}", path.display(), error))
}

fn read_json_file<T>(path: &Path) -> Result<T, String>
where
    T: for<'de> Deserialize<'de>,
{
    let contents = fs::read_to_string(path)
        .map_err(|error| format!("ExecuNow could not read {}: {}", path.display(), error))?;

    serde_json::from_str(&contents)
        .map_err(|error| format!("ExecuNow could not parse {}: {}", path.display(), error))
}

fn write_json_file<T>(path: &Path, value: &T) -> Result<(), String>
where
    T: Serialize,
{
    let contents = serde_json::to_string(value)
        .map_err(|error| format!("ExecuNow could not serialize JSON: {}", error))?;

    if let Some(parent_path) = path.parent() {
        fs::create_dir_all(parent_path).map_err(|error| {
            format!(
                "ExecuNow could not prepare {}: {}",
                parent_path.display(),
                error
            )
        })?;
    }

    fs::write(path, contents)
        .map_err(|error| format!("ExecuNow could not write {}: {}", path.display(), error))
}

#[cfg(test)]
mod tests {
    use super::{
        build_hosts_file_contents, clear_hosts_file_contents, derive_hosts_from_domains,
        render_managed_section, MANAGED_SECTION_END, MANAGED_SECTION_START,
    };

    #[test]
    fn managed_section_renders_stable_markers() {
        let rendered = render_managed_section(&["youtube.com".to_string(), "www.youtube.com".to_string()]);

        assert!(rendered.contains(MANAGED_SECTION_START));
        assert!(rendered.contains("0.0.0.0 youtube.com"));
        assert!(rendered.contains("::1 www.youtube.com"));
        assert!(rendered.contains(MANAGED_SECTION_END));
    }

    #[test]
    fn applying_hosts_content_is_idempotent() {
        let original = "127.0.0.1 localhost\r\n";
        let blocked_hosts = derive_hosts_from_domains(&["youtube.com".to_string()]);
        let once = build_hosts_file_contents(original, &blocked_hosts);
        let twice = build_hosts_file_contents(&once, &blocked_hosts);

        assert_eq!(once, twice);
        assert_eq!(once.matches(MANAGED_SECTION_START).count(), 1);
    }

    #[test]
    fn clearing_hosts_preserves_foreign_entries() {
        let existing = concat!(
            "127.0.0.1 localhost\r\n",
            "# Custom line\r\n",
            "# ExecuNow managed start\r\n",
            "0.0.0.0 youtube.com\r\n",
            "::1 youtube.com\r\n",
            "# ExecuNow managed end\r\n"
        );
        let cleared = clear_hosts_file_contents(existing);

        assert!(cleared.contains("127.0.0.1 localhost"));
        assert!(cleared.contains("# Custom line"));
        assert!(!cleared.contains(MANAGED_SECTION_START));
        assert!(!cleared.contains("youtube.com"));
    }

    #[test]
    fn applying_domains_adds_root_and_www_hosts() {
        let blocked_hosts = derive_hosts_from_domains(&["youtube.com".to_string()]);

        assert_eq!(
            blocked_hosts,
            vec!["youtube.com".to_string(), "www.youtube.com".to_string()]
        );
    }
}
