import React, { Component } from 'react';
import LOGO_PATHS from './constants';

class Navigation extends Component {
  render() {
    return (
      <div className="nav-container">
        {/* Mobile Menu Navigation  */}
        <div className="bar bar--sm visible-xs">
          <div className="container">
              <div className="row">
                <div className="col-3 col-md-2" id="mobile-nav-logo-group">
                  <a href="/">
                      <img className="logo logo-dark"
                           alt="logo"
                           src={ LOGO_PATHS["dark"] } />
                      <img className="logo logo-light"
                           alt="logo"
                           src={ LOGO_PATHS["light"] } />
                  </a>
                </div>
                <div className="col-9 col-md-10 text-right">
                  <a href="#" className="hamburger-toggle"
                     data-toggle-class="#navigation;hidden-xs">
                      <i className="icon icon--sm stack-interface stack-menu"></i>
                  </a>
                </div>
            </div>
          </div>
        </div>
        {/* Navigation Menu */}
        <nav id="navigation" className="bar bar--sm bar-1 hidden-xs">
          <div className="container">
            <div className="row">
              <div className="col-lg-1 col-md-2 hidden-xs" id="navigation-logo-group">
                <div className="bar__module">
                  <a href="/">
                    <img className="logo logo-dark"
                         alt="logo"
                         src={ LOGO_PATHS["dark"] } />
                    <img className="logo logo-light"
                         alt="logo"
                         src={ LOGO_PATHS["light"] } />
                  </a>
                </div>
              </div>
              {/* Main Menu Options */}
              <div className="col-lg-11 col-md-12 text-right text-left-xs text-left-sm">
                <div className="bar__module">
                  <ul className="menu-horizontal text-left">
                    <li>
                      <a href="#">Home</a>
                    </li>
                    <li>
                      <a href="#">Newsfeed</a>
                    </li>
                    <li>
                      <a href="#">Community</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    );
  }
}

export default Navigation;
