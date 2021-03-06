import {
  ACTIVE_RULES_LOCALSTORAGE_KEY,
  AVAILABLE_RULES_LOCALSTORAGE_KEY,
  SCHEMA_URL_LOCALSTORAGE_KEY
} from '@/contants';
import { getExportDataURI, getURL } from '@/utils/parsing';
import ImportConfig from '@components/import-config/ImportConfig';
import Playground from '@components/playground/Playground';
import RuleDefinitions from '@components/rule-definitions/RuleDefinitions';
import TypeExplorer from '@components/schema-view/TypeExplorer';
import { AppBar, Button, CircularProgress, Tab, Tabs, TextField } from '@material-ui/core';
import ExportIcon from '@material-ui/icons/PresentToAll';
import SaveIcon from '@material-ui/icons/SaveAlt';
import IntrospectionQuery from '@queries/introspection.graphql';
import { ErrorMessage } from '@reusable/ErrorMessage';
import { getFieldsForType, getTypes } from '@utils/schema-introspection';
import { request } from 'graphql-request';
import { uniqBy } from 'lodash';
import * as React from 'react';
import { useCounter, useLocalStorage } from 'react-use';
import { isURL } from 'validator';

enum RootParentType {
  QUERY = 'Query',
  MUTATION = 'Mutation',
  TYPE = 'Type'
}

interface ParsedSchemaIntrospection {
  queries?: any;
  mutations?: any;
  types?: any;
}

let isConfigSet = false;

export default ({ config, isViewOnlyMode }: { config?: any; path?: string; isViewOnlyMode: boolean }) => {
  const [url, setURL] = useLocalStorage(SCHEMA_URL_LOCALSTORAGE_KEY, '');
  const [schemaIntrospection, setSchemaIntrospection] = React.useState<ParsedSchemaIntrospection>(null);
  const [error, setError] = React.useState<boolean>(false);
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [selectedViewIndex, { set }] = useCounter(0);
  const [allAvailableRules, setAllAvailableRulesLocalstorage] = useLocalStorage<AvailableRule[]>(
    AVAILABLE_RULES_LOCALSTORAGE_KEY,
    []
  );
  const [allActiveRulesMap, setAllActiveRulesMap] = useLocalStorage<AllActiveRulesMap>(
    ACTIVE_RULES_LOCALSTORAGE_KEY,
    {}
  );
  if (config && !isConfigSet) {
    isConfigSet = true;
    setAllActiveRulesMap(config.activeRules);
    setAllAvailableRules(config.availableRules);
    setURL(config.endpointURL);
    downloadSchemaIntrospection(config.endpointURL);
  }
  function setAllAvailableRules(rules: AvailableRule[]) {
    setAllAvailableRulesLocalstorage(uniqBy(rules, 'name').sort());
  }

  function selecteView(_event, value) {
    set(value);
  }
  function handleURLChange({ target: { value } }) {
    setURL(value);
  }

  const exportDataURI = getExportDataURI(url, allAvailableRules, allActiveRulesMap);

  function downloadSchemaIntrospection(presetURL?: string) {
    setLoading(true);
    setError(false);
    return request(getURL(presetURL || url), IntrospectionQuery)
      .then((res: SchemaIntrospection) => {
        setSchemaIntrospection({
          queries: getFieldsForType(res, 'Query'),
          mutations: getFieldsForType(res, 'Mutation'),
          types: getTypes(res)
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setSchemaIntrospection({});
        setError(err);
        setLoading(false);
      });
  }
  const rulesControlProps = {
    allAvailableRules,
    allActiveRulesMap,
    setAllAvailableRules,
    setAllActiveRulesMap,
    isViewOnlyMode
  };

  return (
    <main style={{ width: '80%', margin: 'auto', paddingTop: '20px', marginBottom: '10px' }}>
      {!isLoading && !error && !schemaIntrospection && (
        <p>Download schema introspection to start working with your config</p>
      )}
      <TextField
        id="outlined-name"
        label="Schema URL"
        value={url}
        fullWidth
        onChange={handleURLChange}
        margin="normal"
      />
      <div style={{ marginBottom: '14px', marginTop: '4px' }}>
        <Button
          disabled={!isURL(getURL(url))}
          onClick={() => {
            downloadSchemaIntrospection();
          }}
          variant="contained"
          color="primary"
        >
          <SaveIcon />
          &nbsp; Download introspection
        </Button>
        <Button
          style={{ float: 'right' }}
          variant="contained"
          color="primary"
          href={exportDataURI}
          download="turtle-config.json"
        >
          <ExportIcon />
          &nbsp; Export config
        </Button>
      </div>
      <AppBar style={{ marginBottom: '14px' }} position="static" color="default">
        <Tabs value={selectedViewIndex} onChange={selecteView} indicatorColor="primary" textColor="primary" fullWidth>
          <Tab label="Query rules" />
          <Tab label="Mutation rules" />
          <Tab label="Per-Type rules" />
          <Tab label="Rule definitions" />
          <Tab label="Playground" />
          {!isViewOnlyMode && <Tab label="Import config" />}
        </Tabs>
      </AppBar>
      {error && <ErrorMessage message="Error fetching schema!" />}
      {isLoading && <CircularProgress />}
      {selectedViewIndex === 0 && !isLoading && schemaIntrospection && (
        <TypeExplorer {...rulesControlProps} parentType={RootParentType.QUERY} fields={schemaIntrospection.queries} />
      )}
      {selectedViewIndex === 1 && !isLoading && schemaIntrospection && (
        <TypeExplorer
          {...rulesControlProps}
          setAllActiveRulesMap={setAllActiveRulesMap}
          parentType={RootParentType.MUTATION}
          fields={schemaIntrospection.mutations}
        />
      )}
      {selectedViewIndex === 2 && !isLoading && schemaIntrospection && (
        <TypeExplorer {...rulesControlProps} parentType={RootParentType.TYPE} fields={schemaIntrospection.types} />
      )}
      {selectedViewIndex === 3 && <RuleDefinitions isViewOnlyMode={isViewOnlyMode} {...rulesControlProps} />}
      {selectedViewIndex === 4 && <Playground {...rulesControlProps} />}
      {selectedViewIndex === 5 && <ImportConfig {...rulesControlProps} setURL={setURL} />}
    </main>
  );
};
