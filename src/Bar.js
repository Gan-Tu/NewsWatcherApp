import React, { Component } from 'react';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';

const COOKIE_MAXAGE = 24*60*60;

class Bar extends Component {

    constructor(props) {
        super(props);
        var token = this.props.cookies.get("authToken");
        var userId = this.props.cookies.get("userId");
        this.state = {
            loggedIn: token ? true : false,
            email: null,
            password: null
        };
    }

     handleLogin = (e) => {
        fetch("/api/session", {
            method: "POST",
            body: JSON.stringify({
                email: this.state.email,
                password: this.state.password
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(res => {
            if (res.ok && res.status === 200) {
                return res.json();
            } else {
                throw Error("Failed to log in");
            }
        }).then(data => {
            console.log("[INFO] Successfully logged in");
            this.setState({
                loggedIn: true
            });
            this.props.cookies.set("displayName", data.displayName, { maxAge: COOKIE_MAXAGE});
            this.props.cookies.set("userId", data.userId, { maxAge: COOKIE_MAXAGE});
            this.props.cookies.set("authToken", data.authToken, { maxAge: COOKIE_MAXAGE});
            window.location.reload();
        }).catch(err => {
            console.log(err);
            window.location.reload();
        });
        e.preventDefault();
    }

    emailChanged = (e) => {
        this.setState({
            email: e.target.value
        });
    }

    passwordChanged = (e) => {
        this.setState({
            password: e.target.value
        });
    }

    handleLogout = (e) => {
        this.setState({
            loggedIn: false,
            authToken: null
        });
        this.props.cookies.remove("authToken");
        window.location.reload();
    }

    render() {
        var displayName = this.props.cookies.get("displayName");
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
                                <ul className="menu-horizontal">
                                    <li style={{display: this.state.loggedIn ? "none" : "inline"}}>
                                        <LoginModal handleLogin={this.handleLogin}
                                                    handleEmailChange={this.emailChanged}
                                                    handlePasswordChange={this.passwordChanged} />
                                    </li>
                                    <li style={{display: this.state.loggedIn ? "inline" : "none"}}>
                                        Welcome, { displayName }!
                                    </li>
                                    <li style={{display: this.state.loggedIn ? "inline" : "none"}}>
                                        <a href="#" onClick={this.handleLogout}> Sign Out</a>
                                    </li>
                                    <li style={{display: this.state.loggedIn ? "none" : "inline"}}>
                                        <SignupModal sideImg="/img/cowork-11.jpg" />
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
}

export default Bar;