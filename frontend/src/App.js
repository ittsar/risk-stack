import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Navigation from './components/Navigation';
import DashboardPage from './pages/DashboardPage';
import RisksPage from './pages/RisksPage';
import ProjectsPage from './pages/ProjectsPage';
import AssetsPage from './pages/AssetsPage';
import FrameworksPage from './pages/FrameworksPage';
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
                    <Route path="/login" component={LoginPage} />
                    <PrivateRoute path="/dashboard" component={DashboardPage} />
                    <PrivateRoute path="/risks" component={RisksPage} />
                    <PrivateRoute path="/projects" component={ProjectsPage} />
                    <PrivateRoute path="/assets" component={AssetsPage} />
                    <PrivateRoute path="/frameworks" component={FrameworksPage} />
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
