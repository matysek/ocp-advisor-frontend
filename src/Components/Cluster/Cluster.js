import './_Cluster.scss';

import React from 'react';
import PropTypes from 'prop-types';

import PageHeader from '@redhat-cloud-services/frontend-components/PageHeader';
import ClusterHeader from '../ClusterHeader';
import Breadcrumbs from '../Breadcrumbs';
import ClusterTabs from '../ClusterTabs/ClusterTabs';
import { Flex, FlexItem, PageSection } from '@patternfly/react-core';
import { UpgradeRisksAlert } from '../UpgradeRisksAlert';
import useUpgradeRisksFeature from '../UpgradeRisksTable/useUpgradeRisksFeature';

export const Cluster = ({ cluster, clusterId }) => {
  const areUpgradeRisksEnabled = useUpgradeRisksFeature(clusterId);

  // TODO: make breadcrumbs take display name from GET /cluster/id/info
  return (
    <React.Fragment>
      <PageHeader className="pf-m-light ins-inventory-detail">
        <Flex direction={{ default: 'column' }}>
          <FlexItem>
            <Breadcrumbs
              current={cluster?.data?.report.meta.cluster_name || clusterId}
            />
            <ClusterHeader />
          </FlexItem>
          {areUpgradeRisksEnabled && <UpgradeRisksAlert />}
        </Flex>
      </PageHeader>
      <PageSection>
        <ClusterTabs cluster={cluster} />
      </PageSection>
    </React.Fragment>
  );
};

Cluster.propTypes = {
  cluster: PropTypes.object.isRequired,
  clusterId: PropTypes.string.isRequired,
};
