#pragma once

#include <string>
#include <memory>
#include <vector>
#include <unordered_map>
#include <chrono>
#include <functional>
#include <optional>
#include <variant>

// Modern C++20 features
#include <concepts>
#include <coroutine>
#include <ranges>
#include <format>

// External libraries
#include <httplib.h>
#include <nlohmann/json.hpp>
#include <jwt-cpp/jwt.h>

namespace qmark {

// Type aliases for modern C++
using json = nlohmann::json;
using HttpServer = httplib::Server;
using HttpRequest = httplib::Request;
using HttpResponse = httplib::Response;
using Timestamp = std::chrono::system_clock::time_point;

// Core data structures matching original schema
struct User {
    std::string id;
    std::optional<std::string> email;
    std::optional<std::string> firstName;
    std::optional<std::string> lastName;
    std::optional<std::string> profileImageUrl;
    Timestamp createdAt;
    Timestamp updatedAt;
    
    json to_json() const;
    static User from_json(const json& j);
};

struct OAuthConnection {
    int id;
    std::string userId;
    std::string platform;
    std::optional<std::string> platformUserId;
    std::optional<std::string> displayName;
    std::optional<std::string> email;
    std::string accessToken;  // encrypted
    std::optional<std::string> refreshToken;  // encrypted
    std::optional<Timestamp> tokenExpiry;
    std::optional<std::string> scope;
    bool isActive = true;
    std::optional<Timestamp> lastSync;
    Timestamp createdAt;
    Timestamp updatedAt;
    
    json to_json() const;
    static OAuthConnection from_json(const json& j);
};

struct Lead {
    int id;
    std::string userId;
    std::optional<std::string> name;
    std::optional<std::string> email;
    std::optional<std::string> phone;
    std::optional<std::string> source;
    std::string status = "new";
    std::optional<std::string> notes;
    std::optional<json> metadata;
    Timestamp createdAt;
    Timestamp updatedAt;
    
    json to_json() const;
    static Lead from_json(const json& j);
};

struct Automation {
    int id;
    std::string userId;
    std::string name;
    std::optional<std::string> description;
    std::string type;
    std::optional<json> config;
    bool isActive = true;
    std::optional<Timestamp> lastRun;
    int runCount = 0;
    Timestamp createdAt;
    Timestamp updatedAt;
    
    json to_json() const;
    static Automation from_json(const json& j);
};

struct Activity {
    int id;
    std::string userId;
    std::string type;
    std::string title;
    std::optional<std::string> description;
    std::optional<json> metadata;
    Timestamp createdAt;
    
    json to_json() const;
    static Activity from_json(const json& j);
};

struct DashboardStats {
    int totalLeads;
    int totalConversions;
    int activeAutomations;
    double totalRevenue;
    
    json to_json() const;
};

// Modern C++20 concepts for type safety
template<typename T>
concept JsonSerializable = requires(T t, const json& j) {
    { t.to_json() } -> std::convertible_to<json>;
    { T::from_json(j) } -> std::convertible_to<T>;
};

template<typename T>
concept DatabaseEntity = JsonSerializable<T> && requires(T t) {
    { t.id } -> std::convertible_to<int>;
    { t.createdAt } -> std::convertible_to<Timestamp>;
};

// Forward declarations
class DatabaseManager;
class AuthHandler;
class SecurityManager;
class Logger;

} // namespace qmark