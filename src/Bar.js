import React, { Component } from 'react';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';

const DUMMY_TOKEN = "bf9026e7eafd";
const COOKIE_MAXAGE = 24*60*60;

class Bar extends Component {

    constructor(props) {
        super(props);
        var token = this.props.cookies.get("authToken");
        if (token && token === DUMMY_TOKEN) {
            this.state = {
                loggedIn: true,
                authToken: token,
                email: null,
                password: null,
                displayName: null
            };
        } else {
            this.state = {
                loggedIn: false,
                authToken: this.props.cookies.get("authToken")
            };
        }
    }

    handleLogin = (e) => {
        var token = this.props.cookies.get("authToken");
        // fetch("/api/session", {
        //     method: "POST",
        //     body: JSON.stringify({
        //         email: this.state.email,
        //         password: this.state.password
        //     }),
        //     headers: {
        //         "Content-Type": "application/json"
        //     }
        // }).then(res => {
        //     if (res.ok && res.status === 200) {
        //         return res.json();
        //     } else {
        //         throw Error(res.)
        //     }
        // }).catch(err)
        // displayName: displayName,
        //                 userId: userId,
        //                 token: token,
        if (token && token === DUMMY_TOKEN) {
            this.setState({
                loggedIn: true,
                authToken: token
            });
        }
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
        var menuButtons;
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
                                    <li style={{display: this.state.loggedIn ?
                                                            "none" : "inline"}}>
                                        <LoginModal handleLogin={this.handleLogin} />
                                    </li>
                                    <li style={{display: this.state.loggedIn ?
                                                            "inline" : "none"}}>
                                        <a href="#" onClick={this.handleLogout}> Sign Out</a>
                                    </li>
                                    <li style={{display: this.state.loggedIn ?
                                                            "none" : "inline"}}>
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