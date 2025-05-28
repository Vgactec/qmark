
#pragma once

#include <string>
#include <fstream>
#include <mutex>
#include <memory>
#include <chrono>
#include <format>

namespace qmark {

enum class LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3,
    CRITICAL = 4
};

class Logger {
private:
    static std::unique_ptr<Logger> instance_;
    static std::mutex mutex_;
    
    std::ofstream log_file_;
    LogLevel min_level_;
    std::mutex file_mutex_;
    
    Logger(const std::string& filename, LogLevel level = LogLevel::INFO);
    
public:
    static void init(const std::string& filename, LogLevel level = LogLevel::INFO);
    static Logger& get_instance();
    
    void log(LogLevel level, const std::string& message);
    
    static void debug(const std::string& message);
    static void info(const std::string& message);
    static void warning(const std::string& message);
    static void error(const std::string& message);
    static void critical(const std::string& message);
    
private:
    std::string get_timestamp();
    std::string level_to_string(LogLevel level);
    bool should_log(LogLevel level) const;
};

} // namespace qmark
