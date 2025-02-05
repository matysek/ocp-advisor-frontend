import { EmptyStateVariant } from '@patternfly/react-core/dist/js/components/EmptyState/EmptyState';

import {
  EmptyStateIcon,
  EmptyStateBody,
  EmptyState,
  Title,
} from '@patternfly/react-core';
import PropTypes from 'prop-types';
import React from 'react';

const MessageState = ({
  className,
  children,
  icon,
  iconClass,
  iconStyle,
  text,
  title,
}) => (
  <EmptyState
    className={className}
    variant="large"
    data-ouia-component-id="empty-state"
    data-ouia-component-type="PF4/EmptyState"
    data-ouia-safe={true}
  >
    {icon && (
      <EmptyStateIcon className={iconClass} style={iconStyle} icon={icon} />
    )}
    <Title headingLevel="h5" size="lg">
      {title}
    </Title>
    <EmptyStateBody>{text}</EmptyStateBody>
    {children}
  </EmptyState>
);

MessageState.propTypes = {
  children: PropTypes.any,
  icon: PropTypes.any,
  iconClass: PropTypes.any,
  iconStyle: PropTypes.any,
  text: PropTypes.any,
  title: PropTypes.string,
  variant: PropTypes.any,
  className: PropTypes.string,
};

MessageState.defaultProps = {
  title: '',
  variant: EmptyStateVariant.full,
};

export default MessageState;
