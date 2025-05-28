#include "database/database_manager.hpp"
#include "utils/logger.hpp"
#include <format>
#include <chrono>
#include <sstream>

namespace qmark {

DatabaseManager::DatabaseManager(const std::string& db_path) 
    : db_path_(db_path) {
}

bool DatabaseManager::initialize() {
    try {
        db_ = std::make_unique<sqlite::database>(db_path_);
        
        // Enable foreign keys and WAL mode for better performance
        *db_ << "PRAGMA foreign_keys = ON;";
        *db_ << "PRAGMA journal_mode = WAL;";
        *db_ << "PRAGMA synchronous = NORMAL;";
        *db_ << "PRAGMA cache_size = 10000;";
        
        Logger::info(std::format("Database connection established: {}", db_path_));
        
        return create_tables();
        
    } catch (const sqlite::sqlite_exception& e) {
        Logger::error(std::format("Database initialization failed: {}", e.what()));
        return false;
    }
}

bool DatabaseManager::create_tables() {
    try {
        auto transaction = begin_transaction();
        
        // Users table
        execute_sql(R"(
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY NOT NULL,
                email TEXT UNIQUE,
                first_name TEXT,
                last_name TEXT,
                profile_image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        )");
        
        // Sessions table (for authentication)
        execute_sql(R"(
            CREATE TABLE IF NOT EXISTS sessions (
                sid TEXT PRIMARY KEY,
                sess TEXT NOT NULL,
                expire DATETIME NOT NULL
            )
        )");
        
        // OAuth connections table
        execute_sql(R"(
            CREATE TABLE IF NOT EXISTS oauth_connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                platform TEXT NOT NULL,
                platform_user_id TEXT,
                display_name TEXT,
                email TEXT,
                access_token TEXT,
                refresh_token TEXT,
                token_expiry DATETIME,
                scope TEXT,
                is_active BOOLEAN DEFAULT 1,
                last_sync DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        )");
        
        // Leads table
        execute_sql(R"(
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                name TEXT,
                email TEXT,
                phone TEXT,
                source TEXT,
                status TEXT DEFAULT 'new',
                notes TEXT,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        )");
        
        // Automations table
        execute_sql(R"(
            CREATE TABLE IF NOT EXISTS automations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                type TEXT NOT NULL,
                config TEXT,
                is_active BOOLEAN DEFAULT 1,
                last_run DATETIME,
                run_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        )");
        
        // Activities table
        execute_sql(R"(
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        )");
        
        // Metrics table
        execute_sql(R"(
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                date DATETIME NOT NULL,
                leads_count INTEGER DEFAULT 0,
                conversions_count INTEGER DEFAULT 0,
                automations_count INTEGER DEFAULT 0,
                revenue DECIMAL(10,2) DEFAULT 0.00,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        )");
        
        // Create indexes for performance
        execute_sql("CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire)");
        execute_sql("CREATE INDEX IF NOT EXISTS idx_oauth_user_platform ON oauth_connections(user_id, platform)");
        execute_sql("CREATE INDEX IF NOT EXISTS idx_leads_user_created ON leads(user_id, created_at DESC)");
        execute_sql("CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)");
        execute_sql("CREATE INDEX IF NOT EXISTS idx_automations_user_active ON automations(user_id, is_active)");
        execute_sql("CREATE INDEX IF NOT EXISTS idx_activities_user_created ON activities(user_id, created_at DESC)");
        execute_sql("CREATE INDEX IF NOT EXISTS idx_metrics_user_date ON metrics(user_id, date)");
        
        transaction->commit();
        Logger::info("Database tables created successfully");
        return true;
        
    } catch (const sqlite::sqlite_exception& e) {
        Logger::error(std::format("Failed to create tables: {}", e.what()));
        return false;
    }
}

// User operations
std::optional<User> DatabaseManager::get_user(const std::string& id) {
    try {
        User user;
        bool found = false;
        
        *db_ << "SELECT id, email, first_name, last_name, profile_image_url, created_at, updated_at FROM users WHERE id = ?"
             << id
             >> [&](std::string id, std::string email, std::string first_name, 
                    std::string last_name, std::string profile_image_url, 
                    std::string created_at, std::string updated_at) {
                user.id = id;
                user.email = email.empty() ? std::nullopt : std::make_optional(email);
                user.firstName = first_name.empty() ? std::nullopt : std::make_optional(first_name);
                user.lastName = last_name.empty() ? std::nullopt : std::make_optional(last_name);
                user.profileImageUrl = profile_image_url.empty() ? std::nullopt : std::make_optional(profile_image_url);
                user.createdAt = string_to_timestamp(created_at);
                user.updatedAt = string_to_timestamp(updated_at);
                found = true;
             };
        
        return found ? std::make_optional(user) : std::nullopt;
        
    } catch (const sqlite::sqlite_exception& e) {
        Logger::error(std::format("Failed to get user {}: {}", id, e.what()));
        return std::nullopt;
    }
}

User DatabaseManager::upsert_user(const User& user) {
    try {
        auto transaction = begin_transaction();
        
        std::string now = timestamp_to_string(std::chrono::system_clock::now());
        
        *db_ << R"(
            INSERT INTO users (id, email, first_name, last_name, profile_image_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                email = excluded.email,
                first_name = excluded.first_name,
                last_name = excluded.last_name,
                profile_image_url = excluded.profile_image_url,
                updated_at = excluded.updated_at
        )" << user.id
           << (user.email ? *user.email : "")
           << (user.firstName ? *user.firstName : "")
           << (user.lastName ? *user.lastName : "")
           << (user.profileImageUrl ? *user.profileImageUrl : "")
           << timestamp_to_string(user.createdAt)
           << now;
        
        transaction->commit();
        
        // Return the updated user
        auto updated_user = get_user(user.id);
        return updated_user ? *updated_user : user;
        
    } catch (const sqlite::sqlite_exception& e) {
        Logger::error(std::format("Failed to upsert user {}: {}", user.id, e.what()));
        throw;
    }
}

// Dashboard stats
DashboardStats DatabaseManager::get_dashboard_stats(const std::string& user_id) {
    try {
        DashboardStats stats = {};
        
        // Get total leads
        *db_ << "SELECT COUNT(*) FROM leads WHERE user_id = ?" << user_id >> stats.totalLeads;
        
        // Get conversions
        *db_ << "SELECT COUNT(*) FROM leads WHERE user_id = ? AND status = 'converted'" 
             << user_id >> stats.totalConversions;
        
        // Get active automations
        *db_ << "SELECT COUNT(*) FROM automations WHERE user_id = ? AND is_active = 1" 
             << user_id >> stats.activeAutomations;
        
        // Get total revenue for current month
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        auto tm = *std::localtime(&time_t);
        tm.tm_mday = 1;
        tm.tm_hour = 0;
        tm.tm_min = 0;
        tm.tm_sec = 0;
        auto month_start = std::chrono::system_clock::from_time_t(std::mktime(&tm));
        
        double revenue = 0.0;
        *db_ << "SELECT COALESCE(SUM(revenue), 0.0) FROM metrics WHERE user_id = ? AND date >= ?" 
             << user_id << timestamp_to_string(month_start) >> revenue;
        
        stats.totalRevenue = revenue;
        
        return stats;
        
    } catch (const sqlite::sqlite_exception& e) {
        Logger::error(std::format("Failed to get dashboard stats for user {}: {}", user_id, e.what()));
        return {};
    }
}

// Helper methods
std::string DatabaseManager::timestamp_to_string(const Timestamp& ts) {
    auto time_t = std::chrono::system_clock::to_time_t(ts);
    std::stringstream ss;
    ss << std::put_time(std::gmtime(&time_t), "%Y-%m-%d %H:%M:%S");
    return ss.str();
}

DatabaseManager::Timestamp DatabaseManager::string_to_timestamp(const std::string& str) {
    std::tm tm = {};
    std::istringstream ss(str);
    ss >> std::get_time(&tm, "%Y-%m-%d %H:%M:%S");
    return std::chrono::system_clock::from_time_t(std::mktime(&tm));
}

void DatabaseManager::execute_sql(const std::string& sql) {
    *db_ << sql;
}

// Transaction implementation
DatabaseManager::Transaction::Transaction(sqlite::database& db) 
    : db_(db), committed_(false) {
    db_ << "BEGIN TRANSACTION";
}

DatabaseManager::Transaction::~Transaction() {
    if (!committed_) {
        try {
            db_ << "ROLLBACK";
        } catch (...) {
            // Ignore rollback errors in destructor
        }
    }
}

void DatabaseManager::Transaction::commit() {
    db_ << "COMMIT";
    committed_ = true;
}

void DatabaseManager::Transaction::rollback() {
    db_ << "ROLLBACK";
    committed_ = true;
}

std::unique_ptr<DatabaseManager::Transaction> DatabaseManager::begin_transaction() {
    return std::make_unique<Transaction>(*db_);
}

} // namespace qmark