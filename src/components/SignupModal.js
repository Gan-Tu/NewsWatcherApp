import React, { Component } from 'react';
import Modal from './Modal';

class SignupModal extends Component {

  handleSignup = (e) => {
      console.info("Sign up link clicked");
      console.log(e);
  }

  render() {
    return (
       <Modal triggerText="Create Account" isSection modalID="signup">
        <section className="imageblock feature-large bg--white border--round ">
          {/* picture of signup form */}
          <div className="imageblock__content col-lg-5 col-md-5 pos-left">
            <div className="background-image-holder">
              <img src={this.props.sideImg} />
            </div>
          </div>
          <div className="container">
            <div className="row justify-content-end">
              <div className="col-lg-7 col-md-7">
                <div className="row justify-content-center">
                  <div className="col-lg-8 col-md-10">
                    <p className="lead">
                      Get started by creating an account.
                    </p>
                    <form onSubmit={this.handleSignup}>
                        <div className="row">
                          {/* main signup form */}
                          <div className="col-12">
                              <input  type="email"
                                      name="email"
                                      placeholder="Email Address" />
                          </div>
                          <div className="col-12">
                              <input  type="password"
                                      name="password"
                                      placeholder="Password" />
                          </div>
                          <div className="col-12">
                              <button type="submit"
                                      className="btn btn--primary type--uppercase">
                                Create Account
                              </button>
                          </div>
                          {/* footer of signup form */}
                          <div className="col-12">
                              <span className="type--fine-print">
                                By signing up, you agree to the  {' '}
                                <a href="#">Terms of Service</a>
                              </span>
                              <span className="type--fine-print block">
                                Already have an account? {' '}
                                <a href="#login">Log in</a>
                              </span>
                          </div>
                        </div>
                    </form>
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

export default SignupModal;
