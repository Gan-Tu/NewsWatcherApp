import React, { Component } from 'react';

class Notification extends Component {
    render() {
        var position = this.props.position || "pos-right pos-top";
        var animation = this.props.animation || "from-top";
        return (
            <div class={"notification col-md-4 col-lg-3" + position }
                 data-animation={ animation }
                 data-autoshow={ this.props.autoshowDelay }
                 data-notification-link={ this.props.triggerLink }>
                { this.props.children }
            </div>
        );
    }
}

export default Notification;

