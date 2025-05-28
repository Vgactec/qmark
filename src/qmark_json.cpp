
#include "qmark.hpp"
#include <chrono>
#include <iomanip>
#include <sstream>

namespace qmark {

// User JSON methods
json User::to_json() const {
    json j = {
        {"id", id},
        {"createdAt", std::chrono::duration_cast<std::chrono::seconds>(createdAt.time_since_epoch()).count()},
        {"updatedAt", std::chrono::duration_cast<std::chrono::seconds>(updatedAt.time_since_epoch()).count()}
    };
    
    if (email) j["email"] = *email;
    if (firstName) j["firstName"] = *firstName;
    if (lastName) j["lastName"] = *lastName;
    if (profileImageUrl) j["profileImageUrl"] = *profileImageUrl;
    
    return j;
}

User User::from_json(const json& j) {
    User user;
    user.id = j.at("id");
    user.email = j.contains("email") && !j["email"].is_null() ? 
                 std::make_optional(j["email"].get<std::string>()) : std::nullopt;
    user.firstName = j.contains("firstName") && !j["firstName"].is_null() ? 
                     std::make_optional(j["firstName"].get<std::string>()) : std::nullopt;
    user.lastName = j.contains("lastName") && !j["lastName"].is_null() ? 
                    std::make_optional(j["lastName"].get<std::string>()) : std::nullopt;
    user.profileImageUrl = j.contains("profileImageUrl") && !j["profileImageUrl"].is_null() ? 
                           std::make_optional(j["profileImageUrl"].get<std::string>()) : std::nullopt;
    
    auto created_time = std::chrono::seconds(j.at("createdAt").get<int64_t>());
    user.createdAt = std::chrono::system_clock::time_point(created_time);
    
    auto updated_time = std::chrono::seconds(j.at("updatedAt").get<int64_t>());
    user.updatedAt = std::chrono::system_clock::time_point(updated_time);
    
    return user;
}

// OAuthConnection JSON methods
json OAuthConnection::to_json() const {
    json j = {
        {"id", id},
        {"userId", userId},
        {"platform", platform},
        {"isActive", isActive},
        {"createdAt", std::chrono::duration_cast<std::chrono::seconds>(createdAt.time_since_epoch()).count()},
        {"updatedAt", std::chrono::duration_cast<std::chrono::seconds>(updatedAt.time_since_epoch()).count()}
    };
    
    if (platformUserId) j["platformUserId"] = *platformUserId;
    if (displayName) j["displayName"] = *displayName;
    if (email) j["email"] = *email;
    if (refreshToken) j["refreshToken"] = *refreshToken;
    if (tokenExpiry) j["tokenExpiry"] = std::chrono::duration_cast<std::chrono::seconds>(tokenExpiry->time_since_epoch()).count();
    if (scope) j["scope"] = *scope;
    if (lastSync) j["lastSync"] = std::chrono::duration_cast<std::chrono::seconds>(lastSync->time_since_epoch()).count();
    
    // Don't expose access token in JSON for security
    j["accessToken"] = "[ENCRYPTED]";
    
    return j;
}

OAuthConnection OAuthConnection::from_json(const json& j) {
    OAuthConnection conn;
    conn.id = j.at("id");
    conn.userId = j.at("userId");
    conn.platform = j.at("platform");
    conn.accessToken = j.at("accessToken");
    conn.isActive = j.contains("isActive") ? j["isActive"].get<bool>() : true;
    
    conn.platformUserId = j.contains("platformUserId") && !j["platformUserId"].is_null() ? 
                          std::make_optional(j["platformUserId"].get<std::string>()) : std::nullopt;
    conn.displayName = j.contains("displayName") && !j["displayName"].is_null() ? 
                       std::make_optional(j["displayName"].get<std::string>()) : std::nullopt;
    conn.email = j.contains("email") && !j["email"].is_null() ? 
                 std::make_optional(j["email"].get<std::string>()) : std::nullopt;
    conn.refreshToken = j.contains("refreshToken") && !j["refreshToken"].is_null() ? 
                        std::make_optional(j["refreshToken"].get<std::string>()) : std::nullopt;
    conn.scope = j.contains("scope") && !j["scope"].is_null() ? 
                 std::make_optional(j["scope"].get<std::string>()) : std::nullopt;
    
    if (j.contains("tokenExpiry") && !j["tokenExpiry"].is_null()) {
        auto token_time = std::chrono::seconds(j["tokenExpiry"].get<int64_t>());
        conn.tokenExpiry = std::chrono::system_clock::time_point(token_time);
    }
    
    if (j.contains("lastSync") && !j["lastSync"].is_null()) {
        auto sync_time = std::chrono::seconds(j["lastSync"].get<int64_t>());
        conn.lastSync = std::chrono::system_clock::time_point(sync_time);
    }
    
    auto created_time = std::chrono::seconds(j.at("createdAt").get<int64_t>());
    conn.createdAt = std::chrono::system_clock::time_point(created_time);
    
    auto updated_time = std::chrono::seconds(j.at("updatedAt").get<int64_t>());
    conn.updatedAt = std::chrono::system_clock::time_point(updated_time);
    
    return conn;
}

// Activity JSON methods
json Activity::to_json() const {
    json j = {
        {"id", id},
        {"userId", userId},
        {"type", type},
        {"title", title},
        {"createdAt", std::chrono::duration_cast<std::chrono::seconds>(createdAt.time_since_epoch()).count()}
    };
    
    if (description) j["description"] = *description;
    if (metadata) j["metadata"] = *metadata;
    
    return j;
}

Activity Activity::from_json(const json& j) {
    Activity activity;
    activity.id = j.at("id");
    activity.userId = j.at("userId");
    activity.type = j.at("type");
    activity.title = j.at("title");
    
    activity.description = j.contains("description") && !j["description"].is_null() ? 
                           std::make_optional(j["description"].get<std::string>()) : std::nullopt;
    activity.metadata = j.contains("metadata") && !j["metadata"].is_null() ? 
                        std::make_optional(j["metadata"]) : std::nullopt;
    
    auto created_time = std::chrono::seconds(j.at("createdAt").get<int64_t>());
    activity.createdAt = std::chrono::system_clock::time_point(created_time);
    
    return activity;
}

// DashboardStats JSON methods
json DashboardStats::to_json() const {
    return json{
        {"totalLeads", totalLeads},
        {"totalConversions", totalConversions},
        {"activeAutomations", activeAutomations},
        {"totalRevenue", totalRevenue}
    };
}

// Lead JSON methods
json Lead::to_json() const {
    json j = {
        {"id", id},
        {"userId", userId},
        {"status", status},
        {"createdAt", std::chrono::duration_cast<std::chrono::seconds>(createdAt.time_since_epoch()).count()},
        {"updatedAt", std::chrono::duration_cast<std::chrono::seconds>(updatedAt.time_since_epoch()).count()}
    };
    
    if (name) j["name"] = *name;
    if (email) j["email"] = *email;
    if (phone) j["phone"] = *phone;
    if (source) j["source"] = *source;
    if (notes) j["notes"] = *notes;
    if (metadata) j["metadata"] = *metadata;
    
    return j;
}

Lead Lead::from_json(const json& j) {
    Lead lead;
    lead.id = j.at("id");
    lead.userId = j.at("userId");
    lead.status = j.contains("status") ? j["status"].get<std::string>() : "new";
    
    lead.name = j.contains("name") && !j["name"].is_null() ? 
                std::make_optional(j["name"].get<std::string>()) : std::nullopt;
    lead.email = j.contains("email") && !j["email"].is_null() ? 
                 std::make_optional(j["email"].get<std::string>()) : std::nullopt;
    lead.phone = j.contains("phone") && !j["phone"].is_null() ? 
                 std::make_optional(j["phone"].get<std::string>()) : std::nullopt;
    lead.source = j.contains("source") && !j["source"].is_null() ? 
                  std::make_optional(j["source"].get<std::string>()) : std::nullopt;
    lead.notes = j.contains("notes") && !j["notes"].is_null() ? 
                 std::make_optional(j["notes"].get<std::string>()) : std::nullopt;
    lead.metadata = j.contains("metadata") && !j["metadata"].is_null() ? 
                    std::make_optional(j["metadata"]) : std::nullopt;
    
    auto created_time = std::chrono::seconds(j.at("createdAt").get<int64_t>());
    lead.createdAt = std::chrono::system_clock::time_point(created_time);
    
    auto updated_time = std::chrono::seconds(j.at("updatedAt").get<int64_t>());
    lead.updatedAt = std::chrono::system_clock::time_point(updated_time);
    
    return lead;
}

// Automation JSON methods
json Automation::to_json() const {
    json j = {
        {"id", id},
        {"userId", userId},
        {"name", name},
        {"type", type},
        {"isActive", isActive},
        {"runCount", runCount},
        {"createdAt", std::chrono::duration_cast<std::chrono::seconds>(createdAt.time_since_epoch()).count()},
        {"updatedAt", std::chrono::duration_cast<std::chrono::seconds>(updatedAt.time_since_epoch()).count()}
    };
    
    if (description) j["description"] = *description;
    if (config) j["config"] = *config;
    if (lastRun) j["lastRun"] = std::chrono::duration_cast<std::chrono::seconds>(lastRun->time_since_epoch()).count();
    
    return j;
}

Automation Automation::from_json(const json& j) {
    Automation automation;
    automation.id = j.at("id");
    automation.userId = j.at("userId");
    automation.name = j.at("name");
    automation.type = j.at("type");
    automation.isActive = j.contains("isActive") ? j["isActive"].get<bool>() : true;
    automation.runCount = j.contains("runCount") ? j["runCount"].get<int>() : 0;
    
    automation.description = j.contains("description") && !j["description"].is_null() ? 
                             std::make_optional(j["description"].get<std::string>()) : std::nullopt;
    automation.config = j.contains("config") && !j["config"].is_null() ? 
                        std::make_optional(j["config"]) : std::nullopt;
    
    if (j.contains("lastRun") && !j["lastRun"].is_null()) {
        auto run_time = std::chrono::seconds(j["lastRun"].get<int64_t>());
        automation.lastRun = std::chrono::system_clock::time_point(run_time);
    }
    
    auto created_time = std::chrono::seconds(j.at("createdAt").get<int64_t>());
    automation.createdAt = std::chrono::system_clock::time_point(created_time);
    
    auto updated_time = std::chrono::seconds(j.at("updatedAt").get<int64_t>());
    automation.updatedAt = std::chrono::system_clock::time_point(updated_time);
    
    return automation;
}

} // namespace qmark
