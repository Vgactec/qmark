
#include "utils/logger.hpp"
#include <iostream>
#include <iomanip>

namespace qmark {

std::unique_ptr<Logger> Logger::instance_ = nullptr;
std::mutex Logger::mutex_;

Logger::Logger(const std::string& filename, LogLevel level) 
    : min_level_(level) {
    log_file_.open(filename, std::ios::app);
    if (!log_file_.is_open()) {
        std::cerr << "Failed to open log file: " << filename << std::endl;
    }
}

void Logger::init(const std::string& filename, LogLevel level) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (!instance_) {
        instance_ = std::unique_ptr<Logger>(new Logger(filename, level));
    }
}

Logger& Logger::get_instance() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (!instance_) {
        instance_ = std::unique_ptr<Logger>(new Logger("qmark.log"));
    }
    return *instance_;
}

void Logger::log(LogLevel level, const std::string& message) {
    if (!should_log(level)) return;
    
    std::lock_guard<std::mutex> lock(file_mutex_);
    
    std::string log_entry = std::format("[{}] [{}] {}\n", 
        get_timestamp(), 
        level_to_string(level), 
        message);
    
    // Log to file
    if (log_file_.is_open()) {
        log_file_ << log_entry;
        log_file_.flush();
    }
    
    // Log to console for errors and critical
    if (level >= LogLevel::ERROR) {
        std::cerr << log_entry;
    } else if (level >= LogLevel::INFO) {
        std::cout << log_entry;
    }
}

std::string Logger::get_timestamp() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()) % 1000;
    
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
    ss << '.' << std::setfill('0') << std::setw(3) << ms.count();
    return ss.str();
}

std::string Logger::level_to_string(LogLevel level) {
    switch (level) {
        case LogLevel::DEBUG: return "DEBUG";
        case LogLevel::INFO: return "INFO";
        case LogLevel::WARNING: return "WARN";
        case LogLevel::ERROR: return "ERROR";
        case LogLevel::CRITICAL: return "CRITICAL";
        default: return "UNKNOWN";
    }
}

bool Logger::should_log(LogLevel level) const {
    return level >= min_level_;
}

// Static convenience methods
void Logger::debug(const std::string& message) {
    get_instance().log(LogLevel::DEBUG, message);
}

void Logger::info(const std::string& message) {
    get_instance().log(LogLevel::INFO, message);
}

void Logger::warning(const std::string& message) {
    get_instance().log(LogLevel::WARNING, message);
}

void Logger::error(const std::string& message) {
    get_instance().log(LogLevel::ERROR, message);
}

void Logger::critical(const std::string& message) {
    get_instance().log(LogLevel::CRITICAL, message);
}

} // namespace qmark
