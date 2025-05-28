#include "qmark.hpp"
#include <nlohmann/json.hpp>
#include "utils/logger.hpp"

using json = nlohmann::json;

namespace QMark {

namespace JSON {

std::string serialize(const std::map<std::string, std::string>& data) {
    try {
        json j = data;
        return j.dump();
    } catch (const std::exception& e) {
        Logger::error("JSON serialization failed: " + std::string(e.what()));
        return "{}";
    }
}

std::map<std::string, std::string> deserialize(const std::string& json_str) {
    try {
        json j = json::parse(json_str);
        std::map<std::string, std::string> result;

        for (auto& [key, value] : j.items()) {
            if (value.is_string()) {
                result[key] = value.get<std::string>();
            } else {
                result[key] = value.dump();
            }
        }

        return result;
    } catch (const std::exception& e) {
        Logger::error("JSON deserialization failed: " + std::string(e.what()));
        return {};
    }
}

json createResponse(const std::string& status, const std::string& message, const json& data) {
    return json{
        {"status", status},
        {"message", message},
        {"data", data},
        {"timestamp", std::time(nullptr)}
    };
}

json createErrorResponse(const std::string& error, int code) {
    return json{
        {"error", error},
        {"code", code},
        {"timestamp", std::time(nullptr)}
    };
}

} // namespace JSON

} // namespace QMark