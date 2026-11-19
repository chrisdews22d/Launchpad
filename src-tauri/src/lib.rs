use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create local tasks and settings",
        sql: include_str!("../migrations/001_initial.sql"),
        kind: MigrationKind::Up,
    }];

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:launchpad.db", migrations)
                .build(),
        );

    #[cfg(windows)]
    let builder = builder.plugin(tauri_plugin_autostart::Builder::new().build());

    builder
        .run(tauri::generate_context!())
        .expect("failed to start Launchpad");
}
