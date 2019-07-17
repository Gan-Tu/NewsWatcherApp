import React, { Component } from 'react';
import { connect } from 'react-redux';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';

const COOKIE_MAXAGE = 24*60*60;

class Bar extends Component {

    constructor(props) {
        super(props);
        this.state = {
            name: null,
            email: null,
            password: null,
            nameErrMsg: null,
            emailErrMsg: null,
            passwordErrMsg: null
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
            this.props.dispatch({
                type: "LOGIN_USER",
                authToken: data.token,
                displayName: data.displayName,
                userId: data.userId
            });
            this.props.cookies.set("authToken", data.token,
                                                { maxAge: COOKIE_MAXAGE});
            // window.location.reload();
        }).catch(err => {
            console.log(err);
            window.location.reload();
        });
        e.preventDefault();
    }

    handleSignup = (e) => {
        fetch("/api/users", {
            method: "POST",
            body: JSON.stringify({
                displayName: this.state.name,
                email: this.state.email,
                password: this.state.password
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(res => {
            if (res.ok && res.status === 201) {
                return res.json();
            } else {
                throw Error("Failed to create an user");
            }
        }).then(data => {
            console.log("[INFO] Successfully created an user");
            this.props.dispatch({
                type: "CREATE_USER",
                displayName: data.displayName,
                userId: data._id
            });
            // window.location.reload();
        }).catch(err => {
            console.log(err);
            window.location.reload();
        });
        e.preventDefault();
    }

    nameChanged = (e) => {
        var name = e.target.value;
        var errMsg = null;
        if (!name) {
            errMsg = "a name is required";
        } else if (name.length < 3 || name.length > 50) {
            errMsg = "must be 3 to 50 characters";
        } else if (!name.match(/^[0-9a-zA-Z\s-]{3,50}$/)) {
            errMsg = "must consists of spaces and alphanumeric characters";
        }
        this.setState({
            name: name ? name.trim() : null,
            nameErrMsg: errMsg
        });
    }

    emailChanged = (e) => {
        var email = e.target.value;
        var errMsg = null;
        if (!email || !email.match(/@/)) {
            errMsg = "an email is required";
        } else if (email.length < 7 || email.length > 50) {
            errMsg = "must be 7 to 50 characters";
        }
        this.setState({
            email: email,
            emailErrMsg: errMsg
        });
    }

    passwordChanged = (e) => {
        var password = e.target.value;
        var errMsg = null;
        if (!password) {
            errMsg = "an password is required";
        } else if (password.length < 7 || password.length > 20) {
            errMsg = "must be 7 to 20 characters";
        } else if (!password.match(/\d/)) {
            errMsg = "must contain a digit";
        } else if (!password.match(/[a-z]/)) {
            errMsg = "must contain a lowercase";
        } else if (!password.match(/[A-Z]/)) {
            errMsg = "must contain a uppercase";
        }
        this.setState({
            password: password,
            passwordErrMsg: errMsg
        });
    }

    handleLogout = (e) => {
        this.props.dispatch({
            type: "LOGOUT_USER"
        });
        this.props.cookies.remove("authToken");
        window.location.reload();
    }

    render() {
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
                                    <li style={{display: this.props.loggedIn ? "none" : "inline"}}>
                                        <LoginModal handleLogin={this.handleLogin}
                                                    handleEmailChange={this.emailChanged}
                                                    handlePasswordChange={this.passwordChanged} />
                                    </li>
                                    <li style={{display: this.props.loggedIn ? "inline" : "none"}}>
                                        Welcome { ", " + this.props.displayName }!
                                    </li>
                                    <li style={{display: this.props.loggedIn ? "inline" : "none"}}>
                                        <a href="#" onClick={this.handleLogout}> Sign Out</a>
                                    </li>
                                    <li style={{display: this.props.loggedIn ? "none" : "inline"}}>
                                        <SignupModal sideImg="/img/cowork-11.jpg"
                                                     nameErrMsg={this.state.nameErrMsg}
                                                     emailErrMsg={this.state.emailErrMsg}
                                                     passwordErrMsg={this.state.passwordErrMsg}
                                                     handleSignup={this.handleSignup}
                                                     handleNameChange={this.nameChanged}
                                                     handleEmailChange={this.emailChanged}
                                                     handlePasswordChange={this.passwordChanged} />
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

const mapStateToProps = (state) => {
    return {
        loggedIn: state.session.loggedIn,
        displayName: state.session.displayName
    }
}

export default connect(mapStateToProps)(Bar);
