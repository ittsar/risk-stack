import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Navigation from './components/Navigation';
import DashboardPage from './pages/DashboardPage';
import RisksPage from './pages/RisksPage';
import ProjectsPage from './pages/ProjectsPage';
import AssetsPage from './pages/AssetsPage';
import FrameworksPage from './pages/FrameworksPage';
import ControlsPage from './pages/ControlsPage';
import VulnerabilitiesPage from './pages/VulnerabilitiesPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

import './App.css';

const PrivateRoute = ({ component: Component, ...rest }) => {
    const { token } = useAuth();
    return (
        <Route
            {...rest}
            render={(props) => (token ? <Component {...props} /> : <Redirect to="/login" />)}
        />
    );
};

const AppLayout = () => {
    const { token } = useAuth();

    return (
        <div className="app-container">
            {token && <Navigation />}
            <main className="app-main">
                <Switch>
                    <Route exact path="/login" component={LoginPage} />
                    <PrivateRoute exact path="/dashboard" component={DashboardPage} />
                    <PrivateRoute exact path="/risks" component={RisksPage} />
                    <PrivateRoute exact path="/projects" component={ProjectsPage} />
                    <PrivateRoute exact path="/assets" component={AssetsPage} />
                    <PrivateRoute exact path="/controls" component={ControlsPage} />
                    <PrivateRoute exact path="/vulnerabilities" component={VulnerabilitiesPage} />
                    <PrivateRoute exact path="/frameworks" component={FrameworksPage} />
                    <Redirect exact from="/" to="/dashboard" />
                    <Route render={() => <Redirect to="/dashboard" />} />
                </Switch>
            </main>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppLayout />
            </Router>
        </AuthProvider>
    );
}

export default App;

