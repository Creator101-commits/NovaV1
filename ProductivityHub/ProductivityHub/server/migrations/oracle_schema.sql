-- Oracle Cloud Autonomous Database Schema Creation Script
-- Run this script in Oracle SQL Developer or SQL*Plus after connecting to your database

-- Create Users table
CREATE TABLE users (
    id VARCHAR2(36) PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    email VARCHAR2(255) UNIQUE NOT NULL,
    first_name VARCHAR2(255),
    last_name VARCHAR2(255),
    avatar VARCHAR2(500),
    google_id VARCHAR2(255),
    google_access_token CLOB,
    google_refresh_token CLOB,
    preferences CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Classes table
CREATE TABLE classes (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    name VARCHAR2(255) NOT NULL,
    section VARCHAR2(100),
    color VARCHAR2(7),
    google_classroom_id VARCHAR2(255),
    description CLOB,
    teacher_name VARCHAR2(255),
    teacher_email VARCHAR2(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Notes table
CREATE TABLE notes (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    class_id VARCHAR2(36),
    title VARCHAR2(500) NOT NULL,
    content CLOB NOT NULL,
    category VARCHAR2(100),
    tags VARCHAR2(1000),
    is_pinned NUMBER(1) DEFAULT 0,
    color VARCHAR2(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- Create Assignments table
CREATE TABLE assignments (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    class_id VARCHAR2(36),
    title VARCHAR2(500) NOT NULL,
    description CLOB,
    due_date TIMESTAMP,
    priority VARCHAR2(20),
    status VARCHAR2(20),
    google_classroom_id VARCHAR2(255),
    is_custom NUMBER(1) DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- Create Flashcards table
CREATE TABLE flashcards (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    class_id VARCHAR2(36),
    front VARCHAR2(1000) NOT NULL,
    back VARCHAR2(1000) NOT NULL,
    difficulty VARCHAR2(20),
    last_reviewed TIMESTAMP,
    review_count NUMBER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- Create Mood Entries table
CREATE TABLE mood_entries (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    mood NUMBER NOT NULL,
    notes CLOB,
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Journal Entries table
CREATE TABLE journal_entries (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    content CLOB NOT NULL,
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Pomodoro Sessions table
CREATE TABLE pomodoro_sessions (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    duration NUMBER NOT NULL,
    type VARCHAR2(20),
    completed_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create AI Summaries table
CREATE TABLE ai_summaries (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    title VARCHAR2(500) NOT NULL,
    summary_content CLOB NOT NULL,
    summary_type VARCHAR2(50),
    original_content CLOB,
    file_type VARCHAR2(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Bell Schedule table
CREATE TABLE bell_schedule (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    period_name VARCHAR2(100) NOT NULL,
    start_time VARCHAR2(10) NOT NULL,
    end_time VARCHAR2(10) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_class_id ON notes(class_id);
CREATE INDEX idx_classes_user_id ON classes(user_id);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_class_id ON assignments(class_id);
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX idx_ai_summaries_user_id ON ai_summaries(user_id);
CREATE INDEX idx_bell_schedule_user_id ON bell_schedule(user_id);

COMMIT;