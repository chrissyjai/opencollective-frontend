import React from 'react';
import PropTypes from 'prop-types';
import { Mutation } from '@apollo/client/react/components';
import { Trash2 as IconTrash } from '@styled-icons/feather/Trash2';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import ConfirmationModal from '../ConfirmationModal';
import StyledButton from '../StyledButton';

const deleteExpenseMutation = gqlV2/* GraphQL */ `
  mutation DeleteExpense($id: String!) {
    deleteExpense(expense: { id: $id }) {
      id
    }
  }
`;

const removeExpenseFromCache = (cache, { data: { deleteExpense } }) => {
  cache.modify({
    fields: {
      expenses(existingExpenses, { readField }) {
        if (!existingExpenses?.nodes) {
          return existingExpenses;
        } else {
          return {
            ...existingExpenses,
            totalCount: existingExpenses.totalCount - 1,
            nodes: existingExpenses.nodes.filter(expense => deleteExpense.id !== readField('id', expense)),
          };
        }
      },
    },
  });
};

const DeleteExpenseButton = ({ expense, onDelete, buttonProps, isDisabled }) => {
  const [hasDeleteConfirm, showDeleteConfirm] = React.useState(false);
  return (
    <React.Fragment>
      <StyledButton
        buttonStyle="dangerSecondary"
        data-cy="delete-expense-button"
        disabled={isDisabled}
        {...buttonProps}
        onClick={() => showDeleteConfirm(true)}
      >
        <IconTrash size="50%" />
        &nbsp;
        <FormattedMessage id="actions.delete" defaultMessage="Delete" />
      </StyledButton>
      {hasDeleteConfirm && (
        <Mutation mutation={deleteExpenseMutation} context={API_V2_CONTEXT} update={removeExpenseFromCache}>
          {deleteExpense => (
            <ConfirmationModal
              isDanger
              show
              type="delete"
              onClose={() => showDeleteConfirm(false)}
              header={<FormattedMessage id="actions.delete" defaultMessage="Delete" />}
              continueHandler={async () => {
                await deleteExpense({ variables: { id: expense.id } });
                if (onDelete) {
                  await onDelete(expense);
                }
                showDeleteConfirm(false);
              }}
            >
              <FormattedMessage
                id="Expense.DeleteDetails"
                defaultMessage="This will permanently delete the expense and all attachments and comments."
              />
            </ConfirmationModal>
          )}
        </Mutation>
      )}
    </React.Fragment>
  );
};

DeleteExpenseButton.propTypes = {
  isDisabled: PropTypes.bool,
  expense: PropTypes.shape({
    id: PropTypes.string.isRequired,
    legacyId: PropTypes.number.isRequired,
  }),
  onDelete: PropTypes.func,
  buttonProps: PropTypes.object,
};

export default DeleteExpenseButton;
