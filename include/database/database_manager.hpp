
#pragma once

#include "qmark.hpp"
#include <sqlite3.h>
#include <mutex>
#include <thread>

namespace qmark::database {
    
    class DatabaseManager {
    private:
        sqlite3* db_;
        mutable std::mutex db_mutex_;
        std::string db_path_;
        bool is_initialized_;
        
        // Méthodes privées pour l'initialisation
        bool create_tables();
        bool create_indexes();
        bool execute_sql(const std::string& sql);
        sqlite3_stmt* prepare_statement(const std::string& sql);
        void finalize_statement(sqlite3_stmt* stmt);
        
    public:
        explicit DatabaseManager(const std::string& db_path = DEFAULT_DATABASE_PATH);
        ~DatabaseManager();
        
        // Initialisation
        bool initialize();
        bool is_connected() const;
        void close();
        
        // Gestion des utilisateurs
        std::optional<User> create_user(const std::string& username, 
                                       const std::string& email,
                                       const std::string& display_name = "",
                                       const std::string& avatar_url = "",
                                       const std::string& replit_user_id = "");
        std::optional<User> get_user_by_id(UserId user_id);
        std::optional<User> get_user_by_username(const std::string& username);
        std::optional<User> get_user_by_replit_id(const std::string& replit_user_id);
        bool update_user(const User& user);
        bool delete_user(UserId user_id);
        
        // Gestion des connexions OAuth
        std::optional<OAuthConnection> create_oauth_connection(const OAuthConnection& connection);
        std::vector<OAuthConnection> get_user_connections(UserId user_id);
        std::optional<OAuthConnection> get_connection_by_provider(UserId user_id, const std::string& provider);
        bool update_oauth_connection(const OAuthConnection& connection);
        bool delete_oauth_connection(ConnectionId connection_id);
        
        // Métriques et statistiques
        DashboardMetrics get_dashboard_metrics(UserId user_id);
        uint64_t count_users();
        uint64_t count_active_connections();
        
        // Utilitaires
        bool backup_database(const std::string& backup_path);
        bool vacuum_database();
        std::string get_database_version();
        
        // Thread safety
        void begin_transaction();
        void commit_transaction();
        void rollback_transaction();
    };
    
    // Singleton pour l'accès global
    class DatabaseManagerSingleton {
    private:
        static std::unique_ptr<DatabaseManager> instance_;
        static std::mutex instance_mutex_;
        
    public:
        static DatabaseManager& get_instance();
        static void initialize(const std::string& db_path = DEFAULT_DATABASE_PATH);
        static void shutdown();
    };
}
