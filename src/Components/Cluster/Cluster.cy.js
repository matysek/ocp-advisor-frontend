import React from 'react';
import Cluster from '.';
import singleClusterPageReport from '../../../cypress/fixtures/api/insights-results-aggregator/v2/cluster/dcb95bbf-8673-4f3a-a63c-12d4a530aa6f/reports-disabled-false.json';
import {
  checkNoMatchingRecs,
  checkRowCounts,
} from '../../../cypress/utils/table';
import {
  clusterInfoInterceptors,
  clusterReportsInterceptors as interceptors,
  upgradeRisksInterceptors,
} from '../../../cypress/utils/interceptors';

// selectors
const CLUSTER_HEADER = '#cluster-header';
const BREADCRUMBS = 'nav[class=pf-c-breadcrumb]';
const RULES_TABLE = '#cluster-recs-list-table';
const FILTER_CHIPS = 'li[class=pf-c-chip-group__list-item]';
const TAB_BUTTON = '[data-ouia-component-type="PF4/TabButton"]'; // TODO: move to utils

const CLUSTER_ID = '123';
const CLUSTER_NAME = 'Cluster With Issues';

const mount = (initialEntries = ['/clusters/123']) => {
  cy.mountWithContext(<Cluster />, {
    path: '/clusters/:clusterId',
    routerProps: { initialEntries },
  });
};

describe('cluster page', () => {
  describe('in the successful state', () => {
    beforeEach(() => {
      interceptors.successful();
    });

    it('renders main components', () => {
      mount();

      // renders breadcrumbs
      cy.get(BREADCRUMBS)
        .should('have.length', 1)
        .get('.pf-c-breadcrumb__list > :nth-child(2)')
        .should('have.text', CLUSTER_NAME);
      // renders cluster header
      cy.get(CLUSTER_HEADER).should('have.length', 1);
      // renders table component
      cy.get(RULES_TABLE).should('have.length', 1);
      // test how many rows were rendered
      checkRowCounts(singleClusterPageReport.report.data.length, true);
    });

    it('adds additional filters passed by the query parameters, 1', () => {
      mount(['/clusters/123?total_risk=1&text=foo+bar&category=2']);

      cy.get(BREADCRUMBS).should('have.length', 1);
      cy.get(CLUSTER_HEADER).should('have.length', 1);
      cy.get(RULES_TABLE);
      cy.get(FILTER_CHIPS).each(($el) =>
        expect($el.text()).to.be.oneOf(['foo bar', 'Low', 'Performance'])
      );
      checkNoMatchingRecs();
    });

    it('adds additional filters passed by the query parameters, 2', () => {
      mount(['/clusters/123?total_risk=2&text=foo&category=1']);

      cy.get(BREADCRUMBS).should('have.length', 1);
      cy.get(CLUSTER_HEADER).should('have.length', 1);
      cy.get(RULES_TABLE);
      cy.get(FILTER_CHIPS).each(($el) =>
        expect($el.text()).to.be.oneOf([
          'foo',
          'Moderate',
          'Service Availability',
        ])
      );
      checkNoMatchingRecs();
    });

    it('last breadcrumb is cluster name', () => {
      mount();

      cy.get(BREADCRUMBS)
        .should('have.length', 1)
        .get('.pf-c-breadcrumb__list > :nth-child(2)')
        .should('have.text', CLUSTER_NAME);
    });

    it('last breadcrumb is cluster id when name is not available', () => {
      interceptors['successful, cluster name is null']();
      mount();

      cy.get(BREADCRUMBS)
        .should('have.length', 1)
        .get('.pf-c-breadcrumb__list > :nth-child(2)')
        .should('have.text', CLUSTER_ID);
    });
  });

  describe('in the loading state', () => {
    beforeEach(() => {
      interceptors['long responding']();
    });

    it('renders skeleton', () => {
      mount();

      // renders breadcrumbs
      cy.get(BREADCRUMBS).should('have.length', 1);
      // renders cluster header
      cy.get(CLUSTER_HEADER).should('have.length', 1);
      // renders table component
      cy.get(RULES_TABLE).should('have.length', 1);
    });
  });

  describe('in the error state', () => {
    beforeEach(() => {
      interceptors['server error']();
    });

    it('renders empty state component', () => {
      mount();

      // renders breadcrumbs
      cy.get(BREADCRUMBS).should('have.length', 1);
      // renders cluster header
      cy.get(CLUSTER_HEADER).should('have.length', 1);
      // renders table component
      cy.get(RULES_TABLE).should('have.length', 1);
      cy.get('.pf-c-empty-state').should('have.length', 1);
    });
  });
});

describe('upgrade risks', () => {
  beforeEach(() => {
    upgradeRisksInterceptors.successful();
    clusterInfoInterceptors.successful();
    cy.intercept('/feature_flags*', {
      statusCode: 200,
      body: {
        toggles: [
          {
            name: 'ocp-advisor.upgrade-risks.enable-in-stable',
            enabled: true,
            variant: {
              name: 'disabled',
              enabled: true,
            },
          },
        ],
      },
    }).as('featureFlags');
  });

  it('renders two tabs', () => {
    mount();

    cy.get(TAB_BUTTON)
      .should('have.length', 2)
      .and('have.text', 'RecommendationsUpgrade risks');
  });

  describe('managed clusters', () => {
    it('does not render banner and tab', () => {
      clusterInfoInterceptors['successful, managed'](); // override interceptor
      mount();

      cy.ouiaId('recommendations').should(
        'have.attr',
        'data-ouia-safe',
        'true'
      );
      cy.wait('@clusterInfo');

      cy.ouiaId('upgrade-risks-alert').should('not.exist');
      cy.get(TAB_BUTTON)
        .should('have.length', 1)
        .and('have.text', 'Recommendations');
    });
  });

  it('has some upgrade risks', () => {
    mount();

    cy.ouiaId('upgrade-risks-alert').should('have.class', 'pf-m-warning');
    cy.ouiaId('upgrade-risks-alert').within(() => {
      cy.get('h4').should('contain.text', 'Resolve upgrade risks');
    });
  });

  it('has no upgrade risks', () => {
    upgradeRisksInterceptors['successful, empty'](); // override interceptor
    mount();

    cy.ouiaId('upgrade-risks-alert').should('have.class', 'pf-m-success');
    cy.ouiaId('upgrade-risks-alert').within(() => {
      cy.get('h4').should(
        'contain.text',
        'No known upgrade risks identified for this cluster.'
      );
    });
  });

  it('upgrade risks not found', () => {
    upgradeRisksInterceptors['error, not found'](); // override interceptor
    mount();

    cy.ouiaId('upgrade-risks-alert').should('have.class', 'pf-m-warning');
    cy.ouiaId('upgrade-risks-alert').within(() => {
      cy.get('h4').should(
        'contain.text',
        'Upgrade risks are not currently available.'
      );
    });
  });

  it('should not render alert in other error', () => {
    upgradeRisksInterceptors['error, other'](); // override interceptor
    mount();

    cy.ouiaId('upgrade-risks-alert').should('not.exist');
  });

  it('should not render alert in the loading state', () => {
    upgradeRisksInterceptors['long responding'](); // override interceptor
    mount();

    cy.ouiaId('upgrade-risks-alert').should('not.exist');
  });

  describe('active_tab search parameter', () => {
    it('opens upgrade risks tab', () => {
      mount(['/clusters/123?active_tab=upgrade_risks']);
      cy.ouiaId('upgrade-risks-tab').should(
        'have.attr',
        'aria-selected',
        'true'
      );
    });

    it('opens recommendations tab', () => {
      mount(['/clusters/123?active_tab=recommendations']);
      cy.ouiaId('recommendations-tab').should(
        'have.attr',
        'aria-selected',
        'true'
      );
    });
  });

  describe('analytics tracking', () => {
    beforeEach(() => {
      cy.intercept('/analytics/track').as('track');
      clusterInfoInterceptors.successful(); // override interceptor
    });

    it('should track click on upgrade risks tab', () => {
      mount();
      cy.ouiaId('upgrade-risks-tab').click();
      cy.wait('@track');
    });

    it('should track when open with upgrade risks tab', () => {
      mount(['/clusters/123?active_tab=upgrade_risks']);
      cy.wait('@track');
    });
  });
});
