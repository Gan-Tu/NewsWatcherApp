import React, { Component } from 'react';

class Modal extends Component {
    render() {
        return (
            <div className="modal-instance" data-modal-id={this.props.modalID}>
                <a className="modal-trigger" href="#">
                    { this.props.triggerText }
                </a>
                <div className="modal-container" data-modal-id={this.props.modalID}>
                    <div className={"modal-content " +
                                     (this.props.isSection? "section-modal" : "")
                                   }>
                        { this.props.children }
                    </div>
                </div>
            </div>
        );
    }
}

export default Modal;

