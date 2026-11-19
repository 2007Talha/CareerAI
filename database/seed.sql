-- =============================================================================
-- CareerAI Seed Data
-- Canonical skills, 6 career definitions, and career skill requirements
-- =============================================================================

-- =============================================================================
-- CANONICAL SKILLS — master skill list with aliases for normalization
-- =============================================================================

-- Programming Languages
INSERT INTO skills (id, name, category, aliases) VALUES
    ('a0000001-0000-0000-0000-000000000001', 'Python', 'language', ARRAY['python3', 'py']),
    ('a0000001-0000-0000-0000-000000000002', 'JavaScript', 'language', ARRAY['JS', 'Javascript', 'javascript', 'js']),
    ('a0000001-0000-0000-0000-000000000003', 'TypeScript', 'language', ARRAY['TS', 'Typescript', 'typescript', 'ts']),
    ('a0000001-0000-0000-0000-000000000004', 'Java', 'language', ARRAY['java']),
    ('a0000001-0000-0000-0000-000000000005', 'C++', 'language', ARRAY['cpp', 'c++', 'Cpp', 'CPP']),
    ('a0000001-0000-0000-0000-000000000006', 'Go', 'language', ARRAY['golang', 'Golang']),
    ('a0000001-0000-0000-0000-000000000007', 'Rust', 'language', ARRAY['rust']),
    ('a0000001-0000-0000-0000-000000000008', 'SQL', 'language', ARRAY['sql', 'Structured Query Language']),
    ('a0000001-0000-0000-0000-000000000009', 'R', 'language', ARRAY['r-lang', 'R language']),
    ('a0000001-0000-0000-0000-000000000010', 'Bash', 'language', ARRAY['bash', 'shell', 'Shell', 'sh']);

-- Frameworks & Libraries
INSERT INTO skills (id, name, category, aliases) VALUES
    ('b0000001-0000-0000-0000-000000000001', 'React', 'framework', ARRAY['ReactJS', 'React.js', 'reactjs']),
    ('b0000001-0000-0000-0000-000000000002', 'Node.js', 'framework', ARRAY['NodeJS', 'nodejs', 'node']),
    ('b0000001-0000-0000-0000-000000000003', 'Django', 'framework', ARRAY['django']),
    ('b0000001-0000-0000-0000-000000000004', 'Flask', 'framework', ARRAY['flask']),
    ('b0000001-0000-0000-0000-000000000005', 'FastAPI', 'framework', ARRAY['fastapi', 'Fast API']),
    ('b0000001-0000-0000-0000-000000000006', 'Spring Boot', 'framework', ARRAY['SpringBoot', 'spring-boot', 'spring boot']),
    ('b0000001-0000-0000-0000-000000000007', 'TensorFlow', 'framework', ARRAY['tensorflow', 'tf', 'TF']),
    ('b0000001-0000-0000-0000-000000000008', 'PyTorch', 'framework', ARRAY['pytorch', 'Pytorch']),
    ('b0000001-0000-0000-0000-000000000009', 'scikit-learn', 'framework', ARRAY['sklearn', 'scikit learn', 'Scikit-learn']),
    ('b0000001-0000-0000-0000-000000000010', 'Express.js', 'framework', ARRAY['express', 'expressjs', 'Express']),
    ('b0000001-0000-0000-0000-000000000011', 'Next.js', 'framework', ARRAY['nextjs', 'NextJS', 'Next']),
    ('b0000001-0000-0000-0000-000000000012', 'Pandas', 'framework', ARRAY['pandas']),
    ('b0000001-0000-0000-0000-000000000013', 'NumPy', 'framework', ARRAY['numpy', 'Numpy']);

-- Tools & Platforms
INSERT INTO skills (id, name, category, aliases) VALUES
    ('c0000001-0000-0000-0000-000000000001', 'Docker', 'tool', ARRAY['docker', 'containers']),
    ('c0000001-0000-0000-0000-000000000002', 'Kubernetes', 'tool', ARRAY['k8s', 'K8s', 'kubernetes']),
    ('c0000001-0000-0000-0000-000000000003', 'AWS', 'tool', ARRAY['Amazon Web Services', 'aws']),
    ('c0000001-0000-0000-0000-000000000004', 'GCP', 'tool', ARRAY['Google Cloud', 'Google Cloud Platform', 'gcp']),
    ('c0000001-0000-0000-0000-000000000005', 'Azure', 'tool', ARRAY['Microsoft Azure', 'azure']),
    ('c0000001-0000-0000-0000-000000000006', 'Git', 'tool', ARRAY['git', 'GitHub', 'GitLab', 'github', 'gitlab']),
    ('c0000001-0000-0000-0000-000000000007', 'PostgreSQL', 'tool', ARRAY['postgres', 'Postgres', 'postgresql', 'psql']),
    ('c0000001-0000-0000-0000-000000000008', 'MongoDB', 'tool', ARRAY['mongodb', 'mongo', 'Mongo']),
    ('c0000001-0000-0000-0000-000000000009', 'Redis', 'tool', ARRAY['redis']),
    ('c0000001-0000-0000-0000-000000000010', 'Linux', 'tool', ARRAY['linux', 'Ubuntu', 'CentOS', 'Debian']),
    ('c0000001-0000-0000-0000-000000000011', 'Terraform', 'tool', ARRAY['terraform', 'TF', 'tf-infra']),
    ('c0000001-0000-0000-0000-000000000012', 'Jenkins', 'tool', ARRAY['jenkins']),
    ('c0000001-0000-0000-0000-000000000013', 'CI/CD', 'tool', ARRAY['cicd', 'CI CD', 'continuous integration', 'continuous deployment']);

-- Concepts & Domains
INSERT INTO skills (id, name, category, aliases) VALUES
    ('d0000001-0000-0000-0000-000000000001', 'Machine Learning', 'concept', ARRAY['ML', 'ml', 'machine learning']),
    ('d0000001-0000-0000-0000-000000000002', 'Deep Learning', 'concept', ARRAY['DL', 'dl', 'deep learning', 'neural networks']),
    ('d0000001-0000-0000-0000-000000000003', 'Natural Language Processing', 'concept', ARRAY['NLP', 'nlp', 'text mining']),
    ('d0000001-0000-0000-0000-000000000004', 'Computer Vision', 'concept', ARRAY['CV', 'cv', 'image recognition']),
    ('d0000001-0000-0000-0000-000000000005', 'Data Structures & Algorithms', 'concept', ARRAY['DSA', 'dsa', 'algorithms', 'data structures']),
    ('d0000001-0000-0000-0000-000000000006', 'System Design', 'concept', ARRAY['system design', 'systems design', 'architecture']),
    ('d0000001-0000-0000-0000-000000000007', 'RESTful APIs', 'concept', ARRAY['REST', 'REST APIs', 'rest', 'API design']),
    ('d0000001-0000-0000-0000-000000000008', 'Microservices', 'concept', ARRAY['microservices', 'micro-services']),
    ('d0000001-0000-0000-0000-000000000009', 'Network Security', 'concept', ARRAY['network security', 'cybersecurity fundamentals']),
    ('d0000001-0000-0000-0000-000000000010', 'Penetration Testing', 'concept', ARRAY['pentesting', 'pen testing', 'ethical hacking']),
    ('d0000001-0000-0000-0000-000000000011', 'Cryptography', 'concept', ARRAY['crypto', 'encryption']),
    ('d0000001-0000-0000-0000-000000000012', 'Cloud Architecture', 'concept', ARRAY['cloud architecture', 'cloud design']),
    ('d0000001-0000-0000-0000-000000000013', 'DevOps', 'concept', ARRAY['devops', 'Dev Ops']),
    ('d0000001-0000-0000-0000-000000000014', 'Data Engineering', 'concept', ARRAY['data engineering', 'ETL', 'data pipelines']),
    ('d0000001-0000-0000-0000-000000000015', 'Statistical Analysis', 'concept', ARRAY['statistics', 'statistical analysis', 'stats']),
    ('d0000001-0000-0000-0000-000000000016', 'Agile/Scrum', 'concept', ARRAY['agile', 'scrum', 'Agile', 'Scrum', 'kanban']),
    ('d0000001-0000-0000-0000-000000000017', 'Testing & QA', 'concept', ARRAY['testing', 'unit testing', 'QA', 'test automation']),
    ('d0000001-0000-0000-0000-000000000018', 'SIEM Tools', 'concept', ARRAY['SIEM', 'siem', 'Splunk', 'security monitoring']),
    ('d0000001-0000-0000-0000-000000000019', 'Incident Response', 'concept', ARRAY['incident response', 'IR', 'security incidents']),
    ('d0000001-0000-0000-0000-000000000020', 'Data Visualization', 'concept', ARRAY['data viz', 'visualization', 'dashboards']);

-- =============================================================================
-- CAREERS — 6 target careers
-- =============================================================================
INSERT INTO careers (id, name, description, avg_salary_usd, growth_outlook) VALUES
    ('e0000001-0000-0000-0000-000000000001',
     'Software Engineer',
     'Designs, develops, and maintains software systems. Works across the stack — backend services, APIs, databases, and sometimes frontend interfaces. Requires strong fundamentals in DSA, system design, and at least one general-purpose language.',
     120000, 'high'),

    ('e0000001-0000-0000-0000-000000000002',
     'ML Engineer',
     'Builds and deploys machine learning models into production systems. Bridges the gap between research and engineering — requires both ML theory and solid software engineering practices.',
     140000, 'high'),

    ('e0000001-0000-0000-0000-000000000003',
     'Data Scientist',
     'Analyzes complex datasets to extract insights and build predictive models. Strong emphasis on statistics, data wrangling, visualization, and communicating findings to stakeholders.',
     125000, 'high'),

    ('e0000001-0000-0000-0000-000000000004',
     'Cybersecurity Analyst',
     'Protects organizational systems and data from threats. Monitors networks, investigates incidents, conducts vulnerability assessments, and implements security controls.',
     110000, 'high'),

    ('e0000001-0000-0000-0000-000000000005',
     'Cloud Engineer',
     'Designs, implements, and manages cloud infrastructure. Works with IaC tools, containerization, CI/CD pipelines, and ensures reliability, scalability, and cost optimization.',
     130000, 'high'),

    ('e0000001-0000-0000-0000-000000000006',
     'Full Stack Developer',
     'Builds complete web applications from frontend to backend. Proficient in both client-side frameworks and server-side technologies, with strong understanding of databases and deployment.',
     115000, 'high');

-- =============================================================================
-- CAREER SKILLS — requirements per career with weights and target levels
-- Sourced from real job posting patterns (Software Engineer, ML Engineer, etc.)
-- =============================================================================

-- ── Software Engineer ──
INSERT INTO career_skills (career_id, skill_id, importance, weight, target_level) VALUES
    -- Required
    ('e0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'required', 0.150, 4),   -- Python
    ('e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000005', 'required', 0.180, 4),   -- DSA
    ('e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000006', 'required', 0.150, 3),   -- System Design
    ('e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000006', 'required', 0.100, 4),   -- Git
    -- Important
    ('e0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000008', 'important', 0.100, 3),  -- SQL
    ('e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000007', 'important', 0.100, 3),  -- RESTful APIs
    ('e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'important', 0.080, 3),  -- Docker
    ('e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000017', 'important', 0.070, 3),  -- Testing
    -- Optional
    ('e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000016', 'optional', 0.040, 2),   -- Agile
    ('e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000010', 'optional', 0.030, 2);   -- Linux

-- ── ML Engineer ──
INSERT INTO career_skills (career_id, skill_id, importance, weight, target_level) VALUES
    ('e0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'required', 0.160, 5),   -- Python
    ('e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001', 'required', 0.180, 4),   -- Machine Learning
    ('e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000002', 'required', 0.140, 3),   -- Deep Learning
    ('e0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000008', 'required', 0.100, 4),   -- PyTorch
    -- Important
    ('e0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'important', 0.080, 3),  -- Docker
    ('e0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000009', 'important', 0.070, 3),  -- scikit-learn
    ('e0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'important', 0.060, 3),  -- SQL
    ('e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000007', 'important', 0.060, 3),  -- RESTful APIs
    -- Optional
    ('e0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000002', 'optional', 0.050, 2),   -- Kubernetes
    ('e0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000003', 'optional', 0.050, 2),   -- AWS
    ('e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000003', 'optional', 0.050, 2);   -- NLP

-- ── Data Scientist ──
INSERT INTO career_skills (career_id, skill_id, importance, weight, target_level) VALUES
    ('e0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'required', 0.150, 4),   -- Python
    ('e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000015', 'required', 0.180, 4),   -- Statistical Analysis
    ('e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001', 'required', 0.140, 3),   -- Machine Learning
    ('e0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000008', 'required', 0.100, 4),   -- SQL
    -- Important
    ('e0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000012', 'important', 0.090, 4),  -- Pandas
    ('e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000020', 'important', 0.090, 3),  -- Data Visualization
    ('e0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000009', 'important', 0.080, 3),  -- scikit-learn
    ('e0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000009', 'important', 0.060, 3),  -- R
    -- Optional
    ('e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000003', 'optional', 0.050, 2),   -- NLP
    ('e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000014', 'optional', 0.060, 2);   -- Data Engineering

-- ── Cybersecurity Analyst ──
INSERT INTO career_skills (career_id, skill_id, importance, weight, target_level) VALUES
    ('e0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000009', 'required', 0.200, 4),   -- Network Security
    ('e0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000010', 'required', 0.130, 4),   -- Linux
    ('e0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'required', 0.100, 3),   -- Python
    ('e0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000018', 'required', 0.130, 3),   -- SIEM Tools
    -- Important
    ('e0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000010', 'important', 0.110, 3),  -- Penetration Testing
    ('e0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000011', 'important', 0.090, 3),  -- Cryptography
    ('e0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000019', 'important', 0.090, 3),  -- Incident Response
    ('e0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000010', 'important', 0.060, 3),  -- Bash
    -- Optional
    ('e0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000003', 'optional', 0.050, 2),   -- AWS
    ('e0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000008', 'optional', 0.040, 2);   -- SQL

-- ── Cloud Engineer ──
INSERT INTO career_skills (career_id, skill_id, importance, weight, target_level) VALUES
    ('e0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000003', 'required', 0.160, 4),   -- AWS
    ('e0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000001', 'required', 0.140, 4),   -- Docker
    ('e0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000002', 'required', 0.130, 3),   -- Kubernetes
    ('e0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000011', 'required', 0.110, 3),   -- Terraform
    -- Important
    ('e0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000010', 'important', 0.080, 3),  -- Linux
    ('e0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000001', 'important', 0.070, 3),  -- Python
    ('e0000001-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000013', 'important', 0.080, 3),  -- DevOps
    ('e0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000013', 'important', 0.080, 3),  -- CI/CD
    -- Optional
    ('e0000001-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000012', 'optional', 0.050, 2),   -- Cloud Architecture
    ('e0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000010', 'optional', 0.050, 3);   -- Bash

-- ── Full Stack Developer ──
INSERT INTO career_skills (career_id, skill_id, importance, weight, target_level) VALUES
    ('e0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002', 'required', 0.150, 4),   -- JavaScript
    ('e0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000001', 'required', 0.140, 4),   -- React
    ('e0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000002', 'required', 0.120, 4),   -- Node.js
    ('e0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000008', 'required', 0.100, 3),   -- SQL
    -- Important
    ('e0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'important', 0.090, 3),  -- TypeScript
    ('e0000001-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000007', 'important', 0.090, 3),  -- RESTful APIs
    ('e0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000006', 'important', 0.080, 3),  -- Git
    ('e0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000007', 'important', 0.060, 3),  -- PostgreSQL
    -- Optional
    ('e0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000001', 'optional', 0.050, 2),   -- Docker
    ('e0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000011', 'optional', 0.060, 2),   -- Next.js
    ('e0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000008', 'optional', 0.050, 2);   -- MongoDB
