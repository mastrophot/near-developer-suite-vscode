import * as vscode from 'vscode';
import { providers } from 'near-api-js';

function shQuote(value: string): string {
  return `"${value.replace(/(["\\$`])/g, '\\$1')}"`;
}

function getNetwork(): 'mainnet' | 'testnet' {
  return vscode.workspace
    .getConfiguration('nearDeveloperSuite')
    .get<'mainnet' | 'testnet'>('network', 'testnet');
}

export function activate(context: vscode.ExtensionContext) {
  console.log('NEAR Developer Suite is now active');

  const estimateGas = vscode.commands.registerCommand('nearDeveloperSuite.estimateGas', async () => {
    const network = getNetwork();
    try {
      const provider = new providers.JsonRpcProvider({ url: `https://rpc.${network}.near.org` });
      const gasPrice = await provider.gasPrice(null);
      // Average gas for a common call if args provided, else just return price
      const pricePerTgas = BigInt(gasPrice.gas_price) * BigInt(10**12);
      vscode.window.showInformationMessage(
        `[${network}] Gas price: ${gasPrice.gas_price} yocto/gas. 1 TGas ~= ${(Number(pricePerTgas) / 1e24).toFixed(6)} NEAR`
      );
    } catch (e) {
      vscode.window.showErrorMessage(`Failed to fetch gas price from ${network}`);
    }
  });

  const deploy = vscode.commands.registerCommand('nearDeveloperSuite.deployContract', async () => {
    const network = getNetwork();
    const config = vscode.workspace.getConfiguration('nearDeveloperSuite');
    const uri = await vscode.window.showOpenDialog({ 
      canSelectFiles: true, 
      filters: { 'WASM': ['wasm'] },
      openLabel: `Deploy to ${network}`
    });
    
    if (uri && uri[0]) {
      const configuredAccount = config.get<string>('accountId', '').trim();
      const accountId = await vscode.window.showInputBox({
        prompt: `Enter Account ID for ${network} deployment`,
        value: configuredAccount,
        validateInput: (value) => {
          const normalized = value.trim();
          if (normalized.length < 2 || normalized.length > 64) {
            return 'Invalid account length';
          }
          return undefined;
        }
      });
      if (!accountId) return;

      const nearCliCommand = config.get<string>('nearCliCommand', 'near').trim() || 'near';
      const deploymentCommand =
        `${nearCliCommand} deploy --wasmFile ${shQuote(uri[0].fsPath)} ` +
        `--accountId ${shQuote(accountId.trim())} --networkId ${shQuote(network)}`;

      const run = await vscode.window.showInformationMessage(
        `Run deploy via terminal? ${deploymentCommand}`,
        { modal: true },
        'Run'
      );
      if (run !== 'Run') {
        return;
      }

      const terminal = vscode.window.createTerminal('NEAR Deploy');
      terminal.show(true);
      terminal.sendText(deploymentCommand, true);
      vscode.window.showInformationMessage(
        `Deployment command sent to terminal (${network}).`
      );
    }
  });


  context.subscriptions.push(estimateGas, deploy);
}

export function deactivate() {}
