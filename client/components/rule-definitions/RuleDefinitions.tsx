import { isValidJavascriptCode } from '@/utils/parsing';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  ExpansionPanel,
  ExpansionPanelActions,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Fab,
  FormControl,
  FormHelperText,
  Grid,
  Paper,
  TextField,
  Typography
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import * as React from 'react';
import { useBoolean } from 'react-hanger';
import MonacoEditor from 'react-monaco-editor';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import prism from 'react-syntax-highlighter/styles/prism';

const initialRuleDefinition = `exports.handler = function(requestor, args, request, fetch, config) {
  return requestor.role === 'ADMIN';
}`;

let ruleNameToEdit = '';

export default ({
  setAllActiveRulesMap,
  setAllAvailableRules,
  allActiveRulesMap,
  allAvailableRules,
  isViewOnlyMode
}: RuleUserProps) => {
  const { setTrue: openDialog, setFalse: closeDialog, value: isDialogOpen } = useBoolean(false);
  const [ruleName, setRuleName] = React.useState('');
  const [cacheValidity, setCacheValidity] = React.useState('0');
  const [ruleDefinition, setRuleDefinition] = React.useState(initialRuleDefinition);
  const [isEditMode, setIsEditMode] = React.useState(false);

  function saveRule() {
    if (isEditMode) {
      setAllAvailableRules(
        allAvailableRules.map(item =>
          item.name === ruleNameToEdit ? { ruleDefinition, cacheValidity: Number(cacheValidity), name: ruleName } : item
        )
      );
    } else {
      setAllAvailableRules(
        allAvailableRules.concat({ ruleDefinition, cacheValidity: Number(cacheValidity), name: ruleName })
      );
    }
    setRuleName('');
    setRuleDefinition(initialRuleDefinition);
    setCacheValidity('0');
    closeDialog();
  }

  const handleSetCacheValidity = e => {
    const val = e.target.value;
    if ((Number.isNaN(Number(val)) || val < 0 || (val !== '0' && val.startsWith('0'))) && val !== '') return;
    setCacheValidity(val);
  };

  const deleteRule = (name: string) => () => {
    if (window.confirm('This will delete all associated active rules from all fields/types. Proceed?')) {
      Object.keys(allActiveRulesMap).forEach(fieldName => {
        allActiveRulesMap[fieldName] = allActiveRulesMap[fieldName].filter(r => r !== name);
      });
      setAllActiveRulesMap(allActiveRulesMap);
      setAllAvailableRules(allAvailableRules.filter(rule => rule.name !== name));
    }
  };

  const openEditRuleDialog = (rule: AvailableRule) => () => {
    ruleNameToEdit = rule.name;
    setIsEditMode(true);
    setRuleName(rule.name);
    setRuleDefinition(rule.ruleDefinition);
    setCacheValidity(String(rule.cacheValidity));
    openDialog();
  };

  function openCreateRuleDialog(event) {
    setIsEditMode(false);
    event.stopPropagation();
    openDialog();
  }

  const isValidCode = isValidJavascriptCode(ruleDefinition);
  const uniqueRuleNameBrokenError =
    !isEditMode && allAvailableRules.find(rule => rule.name === ruleName) && 'Rule with this name already exists';
  const canCreateRule = !ruleName || !isValidCode || !!uniqueRuleNameBrokenError;

  return (
    <div>
      {!isViewOnlyMode && (
        <Button onClick={openCreateRuleDialog} variant="contained" color="primary" aria-label="Add">
          <AddIcon />
          &nbsp;Create new rule
        </Button>
      )}
      <div style={{ paddingTop: '15px' }}>
        {allAvailableRules.map(rule => (
          <ExpansionPanel key={rule.name}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{rule.name}</Typography>
            </ExpansionPanelSummary>
            <Divider />
            <ExpansionPanelDetails>
              <SyntaxHighlighter language="javascript" style={prism}>
                {rule.ruleDefinition}
              </SyntaxHighlighter>
            </ExpansionPanelDetails>
            <ExpansionPanelActions>
              <SyntaxHighlighter style={prism}>{`Cache validity: ${rule.cacheValidity}`}</SyntaxHighlighter>
              {!isViewOnlyMode && (
                <>
                  <Fab onClick={openEditRuleDialog(rule)} color="primary" aria-label="Add">
                    <EditIcon />
                  </Fab>
                  <Fab color="secondary" onClick={deleteRule(rule.name)} aria-label="Edit">
                    <DeleteIcon />
                  </Fab>
                </>
              )}
            </ExpansionPanelActions>
          </ExpansionPanel>
        ))}
      </div>
      <Dialog
        PaperProps={{ style: { maxWidth: '1200px', backgroundColor: 'rgb(238, 238, 238)' } }}
        open={isDialogOpen}
        onClose={closeDialog}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">
          <Typography variant="h5">Create new rule</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You can create custom authorization rules here. You can then attach them to your schema types.
          </DialogContentText>
          <FormControl style={{ marginTop: '6px' }} fullWidth>
            <Grid spacing={8} justify="center" container direction="row">
              <Grid style={{ width: '50%' }} item>
                <TextField
                  autoFocus
                  value={ruleName}
                  margin="dense"
                  error={!!uniqueRuleNameBrokenError}
                  label="Rule name"
                  type="string"
                  fullWidth
                  onChange={e => setRuleName(e.target.value)}
                />
                <FormHelperText error>{uniqueRuleNameBrokenError}</FormHelperText>
              </Grid>
              <Grid style={{ width: '50%' }} item>
                <TextField
                  value={cacheValidity}
                  type="string"
                  inputProps={{
                    min: 0,
                    max: 86400
                  }}
                  margin="dense"
                  label="Cache validity in seconds (0 to disable cache)"
                  fullWidth
                  onChange={handleSetCacheValidity}
                />
              </Grid>
            </Grid>
          </FormControl>
          <div style={{ marginBottom: '5px' }}>
            <Typography style={{ marginBottom: '8px' }} variant="h6" color="inherit" noWrap>
              Rule definition
            </Typography>
            <Paper style={{ maxHeight: '580px', paddingTop: '10px', paddingBottom: '6px' }} elevation={3}>
              <MonacoEditor
                width="800"
                height="420"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  formatOnPaste: true,
                  occurrencesHighlight: false,
                  scrollBeyondLastColumn: 0,
                  scrollBeyondLastLine: false
                }}
                language="javascript"
                theme="vs"
                value={ruleDefinition}
                onChange={setRuleDefinition}
              />
            </Paper>
          </div>
        </DialogContent>
        <DialogActions style={{ padding: '5px' }}>
          <Button onClick={closeDialog} color="primary">
            Cancel
          </Button>
          <Button disabled={canCreateRule} onClick={saveRule} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
