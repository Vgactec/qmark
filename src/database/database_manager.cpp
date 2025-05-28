#include "database/database_manager.hpp"
#include "utils/logger.hpp"
#include <filesystem>

namespace QMark {

DatabaseManager& DatabaseManager::getInstance() {
    static DatabaseManager instance;
    return instance;
}

DatabaseManager::DatabaseManager() : db_(nullptr) {}

DatabaseManager::~DatabaseManager() {
    close();
}

bool DatabaseManager::init(const std::string& db_path) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        // Create database directory if it doesn't exist
        std::filesystem::path path(db_path);
        std::filesystem::create_directories(path.parent_path());

        // Open database
        int result = sqlite3_open(db_path.c_str(), &db_);
        if (result != SQLITE_OK) {
            Logger::error("Failed to open database: " + std::string(sqlite3_errmsg(db_)));
            return false;
        }

        db_path_ = db_path;

        // Enable foreign keys
        execute("PRAGMA foreign_keys = ON;");

        // Create tables
        if (!createTables()) {
            Logger::error("Failed to create database tables");
            return false;
        }

        Logger::info("Database initialized successfully: " + db_path);
        return true;

    } catch (const std::exception& e) {
        Logger::error("Database initialization error: " + std::string(e.what()));
        return false;
    }
}

void DatabaseManager::close() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (db_) {
        sqlite3_close(db_);
        db_ = nullptr;
        Logger::info("Database connection closed");
    }
}

bool DatabaseManager::execute(const std::string& sql) {
    if (!db_) {
        Logger::error("Database not initialized");
        return false;
    }

    char* error_msg = nullptr;
    int result = sqlite3_exec(db_, sql.c_str(), nullptr, nullptr, &error_msg);

    if (result != SQLITE_OK) {
        std::string error = error_msg ? error_msg : "Unknown error";
        Logger::error("SQL execution failed: " + error);
        if (error_msg) {
            sqlite3_free(error_msg);
        }
        return false;
    }

    return true;
}

std::vector<std::map<std::string, std::string>> DatabaseManager::query(const std::string& sql) {
    std::vector<std::map<std::string, std::string>> results;

    if (!db_) {
        Logger::error("Database not initialized");
        return results;
    }

    sqlite3_stmt* stmt;
    int result = sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr);

    if (result != SQLITE_OK) {
        Logger::error("SQL prepare failed: " + std::string(sqlite3_errmsg(db_)));
        return results;
    }

    int column_count = sqlite3_column_count(stmt);

    while (sqlite3_step(stmt) == SQLITE_ROW) {
        std::map<std::string, std::string> row;

        for (int i = 0; i < column_count; i++) {
            const char* column_name = sqlite3_column_name(stmt, i);
            const char* column_value = reinterpret_cast<const char*>(sqlite3_column_text(stmt, i));

            row[column_name] = column_value ? column_value : "";
        }

        results.push_back(row);
    }

    sqlite3_finalize(stmt);
    return results;
}

bool DatabaseManager::createTables() {
    // Users table
    std::string users_sql = R"(
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    )";

    // Sessions table
    std::string sessions_sql = R"(
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    )";

    // Data table
    std::string data_sql = R"(
        CREATE TABLE IF NOT EXISTS data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            value INTEGER NOT NULL,
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
    )";

    return execute(users_sql) && execute(sessions_sql) && execute(data_sql);
}

bool DatabaseManager::insertUser(const std::string& username, const std::string& email, const std::string& password_hash) {
    std::string sql = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?);";

    sqlite3_stmt* stmt;
    int result = sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr);

    if (result != SQLITE_OK) {
        Logger::error("Failed to prepare insert user statement: " + std::string(sqlite3_errmsg(db_)));
        return false;
    }

    sqlite3_bind_text(stmt, 1, username.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, email.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, password_hash.c_str(), -1, SQLITE_STATIC);

    result = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (result != SQLITE_DONE) {
        Logger::error("Failed to insert user: " + std::string(sqlite3_errmsg(db_)));
        return false;
    }

    Logger::info("User created successfully: " + username);
    return true;
}

std::optional<std::map<std::string, std::string>> DatabaseManager::getUserByUsername(const std::string& username) {
    std::string sql = "SELECT * FROM users WHERE username = ? LIMIT 1;";

    sqlite3_stmt* stmt;
    int result = sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr);

    if (result != SQLITE_OK) {
        Logger::error("Failed to prepare get user statement: " + std::string(sqlite3_errmsg(db_)));
        return std::nullopt;
    }

    sqlite3_bind_text(stmt, 1, username.c_str(), -1, SQLITE_STATIC);

    if (sqlite3_step(stmt) == SQLITE_ROW) {
        std::map<std::string, std::string> user;
        int column_count = sqlite3_column_count(stmt);

        for (int i = 0; i < column_count; i++) {
            const char* column_name = sqlite3_column_name(stmt, i);
            const char* column_value = reinterpret_cast<const char*>(sqlite3_column_text(stmt, i));

            user[column_name] = column_value ? column_value : "";
        }

        sqlite3_finalize(stmt);
        return user;
    }

    sqlite3_finalize(stmt);
    return std::nullopt;
}

} // namespace QMark