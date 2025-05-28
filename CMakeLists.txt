cmake_minimum_required(VERSION 3.20)
project(qmark-server VERSION 1.0.0 LANGUAGES CXX)

# Set C++20 standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Compiler-specific options
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    add_compile_options(-Wall -Wextra -Wpedantic -O3 -march=native)
endif()

# Find required packages
find_package(PkgConfig REQUIRED)

# Find httplib
find_path(HTTPLIB_INCLUDE_DIR httplib.h)
if(NOT HTTPLIB_INCLUDE_DIR)
    message(FATAL_ERROR "httplib.h not found. Please install cpp-httplib")
endif()

# Find nlohmann/json
find_package(nlohmann_json REQUIRED)

# Find SQLite
find_package(SQLite3 REQUIRED)

# Find OpenSSL
find_package(OpenSSL REQUIRED)

# Include directories
include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${HTTPLIB_INCLUDE_DIR}
    ${SQLite3_INCLUDE_DIRS}
)

# Source files
set(SOURCES
    src/main.cpp
    src/server/http_server.cpp
    src/database/database_manager.cpp
    src/utils/logger.cpp
    src/security/encryption.cpp
    src/qmark_json.cpp
)

# Create executable
add_executable(qmark-server ${SOURCES})

# Link libraries
target_link_libraries(qmark-server
    PRIVATE
    nlohmann_json::nlohmann_json
    SQLite::SQLite3
    OpenSSL::SSL
    OpenSSL::Crypto
    pthread
)

# Compiler definitions
target_compile_definitions(qmark-server PRIVATE
    CPPHTTPLIB_OPENSSL_SUPPORT
    SQLITE_THREADSAFE=1
)

# Installation
install(TARGETS qmark-server
    RUNTIME DESTINATION bin
)

# Custom target for development
add_custom_target(dev
    COMMAND ${CMAKE_CURRENT_BINARY_DIR}/qmark-server
    DEPENDS qmark-server
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
)

# Debug configuration
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    target_compile_definitions(qmark-server PRIVATE DEBUG=1)
    target_compile_options(qmark-server PRIVATE -g -O0)
endif()

# Release configuration
if(CMAKE_BUILD_TYPE STREQUAL "Release")
    target_compile_definitions(qmark-server PRIVATE NDEBUG=1)
    target_compile_options(qmark-server PRIVATE -O3 -DNDEBUG)
endif()