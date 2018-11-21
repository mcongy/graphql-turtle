import { ErrorMessage } from '@components/_reusable/ErrorMessage';
import { Button, Paper, TextField } from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import * as React from 'react';

export default () => {
  const [config, setConfig] = React.useState('');
  const [errors, setErrors] = React.useState([]);

  function handleConfigChange(e) {
    const cfg = e.target.value;
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(cfg);
    } catch (e) {
      setConfig(cfg);
      return setErrors(['Invalid json!']);
    }
    const validationErrors = [];
    if (typeof parsedConfig.endpointURL !== 'string' || !parsedConfig.endpointURL) {
      validationErrors.push('endpointURL must be a non-empty string');
    }
    if (typeof parsedConfig.activeRules !== 'object' || Array.isArray(parsedConfig.activeRules)) {
      validationErrors.push('activeRules must be an object');
    }
    if (!Array.isArray(parsedConfig.availableRules)) {
      validationErrors.push('available rules must be an array');
    }
    if (validationErrors.length) {
      setErrors(validationErrors);
    } else {
      setErrors([]);
    }
    setConfig(cfg);
  }

  return (
    <div>
      {config && errors.length > 0 && <ErrorMessage message={errors[0]} />}
      <Paper>
        <TextField
          style={{ marginTop: '18px', padding: '0px 12px 8px 12px' }}
          placeholder="Enter your pre-defined graphql-turtle configuration here."
          multiline={true}
          value={config}
          onChange={handleConfigChange}
          fullWidth
          rows={16}
          rowsMax={20}
        />
        <Button variant="contained" style={{ marginTop: '18px', float: 'right' }} color="primary">
          <SaveIcon />
          &nbsp;&nbsp; Import
        </Button>
      </Paper>
    </div>
  );
};
