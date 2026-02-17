import * as vscode from 'vscode';
import { providers } from 'near-api-js';

export function activate(context: vscode.ExtensionContext) {
  console.log('NEAR Developer Suite is now active');

  const estimateGas = vscode.commands.registerCommand('nearDeveloperSuite.estimateGas', async () => {
    const network = 'mainnet'; // Could be configurable
    try {
      const provider = new providers.JsonRpcProvider({ url: `https://rpc.${network}.near.org` });
      const gasPrice = await provider.gasPrice(null);
      // Average gas for a common call if args provided, else just return price
      const pricePerTgas = BigInt(gasPrice.gas_price) * BigInt(10**12);
      vscode.window.showInformationMessage(`Current Gas Price: ${gasPrice.gas_price} yocto/gas. 1 TGas costs ~${(Number(pricePerTgas) / 1e24).toFixed(6)} NEAR`);
    } catch (e) {
      vscode.window.showErrorMessage('Failed to fetch gas price from network');
    }
  });

  const deploy = vscode.commands.registerCommand('nearDeveloperSuite.deployContract', async () => {
    const uri = await vscode.window.showOpenDialog({ 
      canSelectFiles: true, 
      filters: { 'WASM': ['wasm'] },
      openLabel: 'Deploy'
    });
    
    if (uri && uri[0]) {
      const accountId = await vscode.window.showInputBox({ prompt: 'Enter Account ID for deployment' });
      if (!accountId) return;

      vscode.window.showInformationMessage(`Deploying ${uri[0].fsPath} to ${accountId}...`);
      // Use near-api-js or near-cli integration
      vscode.window.showWarningMessage('Please ensure you have authenticated with NEAR CLI or provide a Private Key in settings.');
    }
  });


  context.subscriptions.push(estimateGas, deploy);
}

export function deactivate() {}
