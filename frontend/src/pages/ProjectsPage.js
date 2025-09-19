import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ProjectsPage = () => {
    const { token } = useAuth();
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const response = await apiRequest('/api/projects/', { token });
                setProjects(response.results ?? response);
            } catch (err) {
                setError(err.message);
            }
        };

        if (token) {
            loadProjects();
        }
    }, [token]);

    return (
        <div>
            <div className="page-header">
                <h1>Projects</h1>
            </div>
            <div className="card">
                {error ? (
                    <p style={{ color: '#dc2626' }}>Failed to load projects: {error}</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Owner</th>
                                <th>Status</th>
                                <th>Timeline</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id}>
                                    <td>{project.name}</td>
                                    <td>{project.owner || '—'}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{project.status.replace('_', ' ')}</td>
                                    <td>
                                        {project.start_date || '—'} → {project.target_end_date || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ProjectsPage;
