import React, { Component } from 'react';

import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';

class Bar extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loggedIn: false,
            authToken: null
        }
    }

    handleLogin = (e) => {
        this.setState({
            loggedIn: true
        });
        // e.preventDefault();
    }

    handleLogout = (e) => {
        this.setState({
            loggedIn: false,
            authToken: null
        });
        // e.preventDefault();
    }

    render() {
        var menuButtons;
        if (!this.state.loggedIn) {
            menuButtons = (
                <ul className="menu-horizontal">
                    <li>
                        <LoginModal handleLogin={this.handleLogin} />
                    </li>
                    <li>
                        <SignupModal sideImg="/img/cowork-11.jpg" />
                    </li>
                </ul>
            );
        } else {
            menuButtons = (
                <ul className="menu-horizontal">
                    <li>
                        <a href="#" onClick={this.handleLogout}> Sign Out</a>
                    </li>
                </ul>
            );
        }

        return (
            <section className="bar bar-3 bar--sm bg--secondary">
                <div className="container">
                    <div className="row">
                        {/* Main website title */}
                        <div className="col-lg-6">
                            <div className="bar__module">
                                <span className="type--fade">
                                    { this.props.title }
                                </span>
                            </div>
                        </div>
                        {/* Bar action buttons */}
                        <div className="col-lg-6 text-right text-left-xs text-left-sm">
                            <div className="bar__module">
                                { menuButtons }
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
}

export default Bar;