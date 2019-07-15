import React, { Component } from 'react';
import Socicon from "./components/Socicon";
import LOGO_PATHS from './constants';

class Footer extends Component {
    render() {
        return (
            <footer className="footer-3 text-center-xs space--xs">
                <div className="container">
                    <div className="row">
                        <div className="col-md-6">
                            <img alt="Image" className="logo" src={ LOGO_PATHS["dark"] } />
                            <ul className="list-inline list--hover">
                                <li className="list-inline-item">
                                    <a href="#">
                                        <span className="type--fine-print">Get Started</span>
                                    </a>
                                </li>
                                <li className="list-inline-item">
                                    <a href="mailto:help@tugan.io">
                                        <span className="type--fine-print">help@tugan.io</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div className="col-md-6 text-right text-center-xs">
                            <ul className="social-list list-inline list--hover">
                                <li className="list-inline-item">
                                    <Socicon icon="google" />
                                </li>
                                <li className="list-inline-item">
                                    <Socicon icon="twitter" />
                                </li>
                                <li className="list-inline-item">
                                    <Socicon icon="facebook" />
                                </li>
                                <li className="list-inline-item">
                                    <Socicon icon="instagram" />
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6">
                            <p className="type--fine-print">
                                Supercharge your web workflow
                            </p>
                        </div>
                        <div className="col-md-6 text-right text-center-xs">
                            <span className="type--fine-print">&copy;
                                <span className="update-year"></span>Stack Inc.</span>
                            <a className="type--fine-print" href="#">Privacy Policy</a>
                            <a className="type--fine-print" href="#">Legal</a>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }
}

export default Footer;