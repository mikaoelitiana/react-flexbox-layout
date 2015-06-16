import _ from 'lodash';
import React from 'react';
import VLayoutItemIE9 from './vertical_item_ie9';
import {VLayoutPropTypes, VLayoutDefaultPropTypes} from './prop_types';
import {getVGutterSizes, forEachNonEmpty, mapNonEmpty, countNonEmpty, sumSizes, addTo, getSizeCalc} from './util';
import {register, deregister, requestAsyncUpdate} from './update_engine_ie9';


export default class VLayoutIE9 extends React.Component {

  componentWillMount() {
    register(this);
  }

  componentDidMount() {
    this.node = React.findDOMNode(this);
    requestAsyncUpdate();
  }

  componentWillUnmount() {
    deregister(this);
  }

  componentDidUpdate() {
    requestAsyncUpdate();
  }

  render() {
    this.itemsRefs = [];
    this.gutterSizes = getVGutterSizes(this.props.children, this.props.gutter);

    let children = mapNonEmpty(this.props.children, (child, index) => {
      return this._buildChild(child, index);
    });

    return (
      <div ref="wrapper" data-display-name="VLayoutWrapper"
        style={_.extend(this._getLayoutWrapperStyles(), this.props.style)}
      >
        <div ref="container" data-display-name="VLayout"
          style={this._getLayoutStyles()}
        >
          {children}
        </div>
      </div>
    );
  }

  _buildChild(child, index) {
    let props = {};

    let ref = `item_${index}`;
    this.itemsRefs.push(ref);

    props.justify = child.props.justify || this.props.justifyItems;
    props.ref = ref;

    // Pass down the gutters
    if (index === 0) {
      props._gutterTop = this.gutterSizes[0];
    }
    props._gutterBottom = this.gutterSizes[index + 1];
    props.justify = child.props.justify || this.props.justifyItems;

    if (child.type === VLayoutItemIE9) {
      return React.cloneElement(child, props);
    } else {
      return <VLayoutItemIE9 {...props}>{child}</VLayoutItemIE9>;
    }
  }

  _unsetLayoutStyles() {
    const style = this.node.style;

    if (!this.props.height) {
      style.height = '';
    }

    _.range(countNonEmpty(this.props.children)).forEach((i) => {
      this.refs[`item_${i}`]._unsetLayoutStyles();
    }, this);
  }

  _measureInheritedStyles() {
    const computedStyle = window.getComputedStyle(this.node);
    this._inheritedTextAlign = computedStyle.textAlign;
  }

  _measureWidths() {}

  _applyInheritedStyles() {
    const items = this.itemsRefs.map(ref => this.refs[ref]);
    _.invoke(items, '_applyInheritedStyles', this._inheritedTextAlign);
  }

  _applyWidths() {}

  _measureItemHeights() {
    const items = this.itemsRefs.map(ref => this.refs[ref]);

    this._measuredHeights = items.map((item) => {
      if (item.props.height || item.props.flexGrow) {
        return 0;
      }
      return item._measureHeight();
    });
  }

  _applyFlexHeights() {
    const items = this.itemsRefs.map(ref => this.refs[ref]);

    const totalFlexGrow = _(items)
      .filter(item => item.props.flexGrow)
      .map(item => item.props.flexGrow === true ? 1 : item.props.flexGrow)
      .sum();

    // sum widths used up by elements
    const usedSpace = sumSizes('height', items);

    // add computed widths
    addTo(usedSpace, 'px', _.sum(this._measuredHeights));

    // add gutters
    addTo(usedSpace, 'rem', _.sum(this.gutterSizes));

    _.range(countNonEmpty(this.props.children)).forEach((i) => {
      const item = this.refs[`item_${i}`];
      if (item.props.flexGrow) {
        return item._applyHeight(getSizeCalc(usedSpace, item.props.flexGrow, totalFlexGrow));
      }
    });
  }

  _getLayoutWrapperStyles() {
    let styles = {
      width: this.props.width || '100%',
      height: this.props.height
    };

    if (this._isFlexboxLayout()) {
      styles.display = 'block';
    } else {
      styles.display = 'table';
      styles.tableLayout = 'fixed';
    }

    return styles;
  }

  _getLayoutStyles() {
    let styles = {
      display: this._isFlexboxLayout() ? 'block' : 'table-cell',
      height: '100%',
      verticalAlign: this.props.alignItems
    };

    return styles;
  }

  // Whenever one of the children has a flexGrow the whole layout
  // becomes 'flex'
  _isFlexboxLayout() {
    let hasFlexGrowChild = false;
    forEachNonEmpty(this.props.children, (child) => {
      if (child.props.flexGrow) {
        hasFlexGrowChild = true;
      }
    });

    return hasFlexGrowChild;
  }
}


VLayoutIE9.displayName = 'VLayoutIE9';
VLayoutIE9.propTypes = VLayoutPropTypes;
VLayoutIE9.defaultProps = VLayoutDefaultPropTypes;
