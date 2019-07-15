import React, { Component } from 'react';

class Pagination extends Component {
  render() {
    let prevPage = Math.max(this.props.start, this.props.current - 1);
    let nextPage = Math.min(this.props.end, this.props.current + 1);
    // let pages = [];
    // for (var i = this.props.start; i <= this.props.end; i++) {
    //     if (i === this.props.current) {
    //         pages.push(
    //             <li className="pagination__current" key={"page-" + i}>
    //                 <a href="#"
    //                   onClick={this.props.handleChangePage.bind(this, i)}>
    //                    { i }
    //                 </a>
    //             </li>
    //         );
    //     } else {
    //         pages.push(
    //             <li key={"page-" + i}>
    //                 <a href="#"
    //                    onClick={this.props.handleChangePage.bind(this, i)}>
    //                    { i }
    //               </a>
    //             </li>
    //         );
    //     }
    // }
    // if (pages.length >= 10) {
    //   let shrinkedStart = Math.max(1, this.props.current);
    //   let shrinkedEnd = Math.max(shrinkedStart+5, this.props.current);
    //   let shrinkedPages = pages.slice(shrinkedStart, shrinkedStart+5);
    //   shrinkedPages.push((
    //     <li key="page-elipse">
    //       <a href="#"> ... </a>
    //     </li>
    //   ));
    //   shrinkedPages = shrinkedPages.concat(pages.slice(shrinkedEnd));
    //   pages = shrinkedPages;
    // }
    return (
        <div className="pagination">
            <a className="pagination__prev"
               href="#"
               onClick={this.props.handleChangePage.bind(this, prevPage)}
               title="Previous Page">
               <i className="icon icon--sm icon-Previous"></i>
            </a>
            <ol>
                <li className="pagination__current" key="current-page">
                    <a href="#"> { this.props.current }</a>
                </li>
            </ol>
            <a className="pagination__next"
               href="#"
               onClick={this.props.handleChangePage.bind(this, nextPage)}
               title="Next Page">
               <i className="icon icon--sm icon-Next2"></i>
            </a>
        </div>
    );
  }
}

export default Pagination;
