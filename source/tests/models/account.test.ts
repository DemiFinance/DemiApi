import { Account } from '../../models/account';
describe('Account Model', () => {
  test('Account interface', () => {
    const account: Account = {
      accountId: 'test-account-id',
      holderId: 'test-holder-id',
    };
    expect(account).toBeTruthy();
  });
});


