#pragma once

#include "qmark.hpp"
#include <sqlite_modern_cpp.h>
#include <memory>
#include <vector>
#include <optional>

namespace qmark {

class DatabaseManager {
private:
    std::unique_ptr<sqlite::database> db_;
    std::string db_path_;

public:
    explicit DatabaseManager(const std::string& db_path);
    ~DatabaseManager() = default;

    // Initialization
    bool initialize();
    bool create_tables();
    bool migrate_schema();

    // User operations
    std::optional<User> get_user(const std::string& id);
    User upsert_user(const User& user);
    bool delete_user(const std::string& id);

    // OAuth connections
    std::vector<OAuthConnection> get_oauth_connections(const std::string& user_id);
    std::optional<OAuthConnection> get_oauth_connection(int id);
    OAuthConnection create_oauth_connection(const OAuthConnection& connection);
    std::optional<OAuthConnection> update_oauth_connection(int id, const OAuthConnection& updates);
    bool delete_oauth_connection(int id);

    // Leads
    std::vector<Lead> get_leads(const std::string& user_id, int limit = 50);
    Lead create_lead(const Lead& lead);
    std::optional<Lead> update_lead(int id, const Lead& updates);
    bool delete_lead(int id);

    // Automations
    std::vector<Automation> get_automations(const std::string& user_id);
    Automation create_automation(const Automation& automation);
    std::optional<Automation> update_automation(int id, const Automation& updates);
    bool delete_automation(int id);

    // Activities
    std::vector<Activity> get_activities(const std::string& user_id, int limit = 20);
    Activity create_activity(const Activity& activity);

    // Dashboard stats
    DashboardStats get_dashboard_stats(const std::string& user_id);

    // Database maintenance
    bool vacuum();
    bool backup(const std::string& backup_path);
    bool restore(const std::string& backup_path);

private:
    // Helper methods
    std::string timestamp_to_string(const Timestamp& ts);
    Timestamp string_to_timestamp(const std::string& str);
    void execute_sql(const std::string& sql);
    
    // Transaction management
    class Transaction {
    private:
        sqlite::database& db_;
        bool committed_;
    public:
        explicit Transaction(sqlite::database& db);
        ~Transaction();
        void commit();
        void rollback();
    };
    
    std::unique_ptr<Transaction> begin_transaction();
};

} // namespace qmark