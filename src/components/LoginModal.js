import React, { Component } from 'react';
import Modal from './Modal';

class LoginModal extends Component {

  render() {
    return (
      <Modal triggerText="Login" isSection modalID="login">
        <section className="unpad">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-6">
                <div className="boxed boxed--lg bg--white text-center feature">
                  <div className="modal-close modal-close-cross"></div>
                  <h3>Login to Your Account</h3>
                  <div className="feature__body">
                    {/* main login form */}
                    <form onSubmit={this.props.handleLogin}>
                      <div className="row">
                        <div className="col-md-12">
                          <input type="text" placeholder="User Name" />
                        </div>
                        <div className="col-md-12">
                          <input type="password" placeholder="Password" />
                        </div>
                        <div className="col-md-12">
                          <button className="btn btn--primary type--uppercase" type="submit">
                            Login
                          </button>
                        </div>
                      </div>
                    </form>
                    {/* footer of login form */}
                    <span className="type--fine-print block">
                      Dont have an account yet? {' '}
                      <a href="#signup">Create account</a>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Modal>
    );
  }
}

export default LoginModal;

