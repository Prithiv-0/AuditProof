-- VeriSchol Database Schema
-- Secure Research Data Integrity System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS otp_sessions CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS research_data CASCADE;
DROP TABLE IF EXISTS project_assignments CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('researcher', 'auditor', 'admin')),
    public_key TEXT,
    encrypted_private_key TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Project Assignments (Linking researchers and auditors to projects)
CREATE TABLE project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_role VARCHAR(20) CHECK (assigned_role IN ('researcher', 'auditor')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Research data with encrypted content
CREATE TABLE research_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    researcher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    encrypted_content TEXT NOT NULL,
    iv VARCHAR(64) NOT NULL,
    auth_tag VARCHAR(64) NOT NULL,
    encrypted_aes_key TEXT NOT NULL,
    -- DEMO ONLY: In production, content would only be stored encrypted
    -- This column allows us to show decrypted content without implementing
    -- full client-side decryption with private key management
    original_content TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'corrupted')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit log for integrity tracking
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_id UUID NOT NULL REFERENCES research_data(id) ON DELETE CASCADE,
    original_hash VARCHAR(64) NOT NULL,
    digital_signature TEXT NOT NULL,
    signer_id UUID NOT NULL REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    verification_status VARCHAR(20) CHECK (verification_status IN ('pending', 'verified', 'tampered')),
    verification_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- OTP sessions for Multi-Factor Authentication
CREATE TABLE otp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_projects_name ON projects(name);
CREATE INDEX idx_project_assignments_user ON project_assignments(user_id);
CREATE INDEX idx_project_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_research_data_project ON research_data(project_id);
CREATE INDEX idx_research_data_researcher ON research_data(researcher_id);
CREATE INDEX idx_research_data_status ON research_data(status);
CREATE INDEX idx_audit_log_data ON audit_log(data_id);
CREATE INDEX idx_otp_user ON otp_sessions(user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_data_updated_at
    BEFORE UPDATE ON research_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON TABLE projects IS 'Logical grouping of research research data';
COMMENT ON TABLE project_assignments IS 'Assigns researchers and auditors to specific projects';
COMMENT ON TABLE research_data IS 'Encrypted research submissions (like notes/pages)';
COMMENT ON TABLE audit_log IS 'Immutable integrity log with signatures';
COMMENT ON TABLE otp_sessions IS 'MFA codes';
