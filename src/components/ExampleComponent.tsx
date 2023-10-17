// https://github.com/safe-global/safe-core-sdk/blob/main/packages/auth-kit/example/src/App.tsx
import { useEffect, useState } from "react"
import {
	ADAPTER_EVENTS,
	CHAIN_NAMESPACES,
	SafeEventEmitterProvider,
	UserInfo,
	WALLET_ADAPTERS,
} from "@web3auth/base"
import { Box, Divider, Grid, Typography } from "@mui/material"
import { OpenloginAdapter } from "@web3auth/openlogin-adapter"
import { Web3AuthOptions } from "@web3auth/modal"

import AppBar from "./AppBar"
import { ethers } from "ethers"

import { Web3AuthModalPack, Web3AuthEventListener } from "@safe-global/auth-kit"
import Safe, { EthersAdapter, SafeFactory, SafeAccountConfig } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'

import type { AuthKitSignInData } from "@safe-global/auth-kit/dist/src/types"
import { EthHashInfo } from "@safe-global/safe-react-components"

// https://web3auth.io/docs/sdk/pnp/web/modal/initialize#arguments

const connectedHandler: Web3AuthEventListener = (data) =>
	console.log("CONNECTED", data)
const disconnectedHandler: Web3AuthEventListener = (data) =>
	console.log("DISCONNECTED", data)

export default function ExampleComponent() {
	const [web3AuthModalPack, setWeb3AuthModalPack] =
		useState<Web3AuthModalPack>()
	const [safeAuthSignInResponse, setSafeAuthSignInResponse] =
		useState<AuthKitSignInData | null>(null)
	const [userInfo, setUserInfo] = useState<Partial<UserInfo>>()
	const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(
		null
	)
	useEffect(() => {
		;(async () => {
			const options: Web3AuthOptions = {
				clientId:
					"BMVbCJGKTNafy5v4B8zf6W87bLvV53uP4ZAF5b7u1eKjBJ9hO8tjCrec2PsI5bwPpqqG0_gI6ZtMl1s624Dvo5s",
				web3AuthNetwork: "testnet",
				chainConfig: {
					chainNamespace: CHAIN_NAMESPACES.EIP155,
					chainId: "0x5",
					rpcTarget: "https://rpc.ankr.com/eth_goerli",
				},
				uiConfig: {
					theme: "dark",
					loginMethodsOrder: ["google", "facebook"],
				},
			}

			const modalConfig = {
				[WALLET_ADAPTERS.METAMASK]: {
					label: "metamask",
					showOnDesktop: true,
					showOnMobile: false,
				},
			}

			const openloginAdapter = new OpenloginAdapter({
				loginSettings: {
					mfaLevel: "mandatory",
				},
				adapterSettings: {
					uxMode: "popup",
					whiteLabel: {
						name: "Safe",
					},
				},
			})

			const web3AuthModalPack = new Web3AuthModalPack({
				txServiceUrl: "https://safe-transaction-goerli.safe.global",
			})

			await web3AuthModalPack.init({
				options,
				adapters: [openloginAdapter],
				modalConfig,
			})

			web3AuthModalPack.subscribe(ADAPTER_EVENTS.CONNECTED, connectedHandler)

			web3AuthModalPack.subscribe(
				ADAPTER_EVENTS.DISCONNECTED,
				disconnectedHandler
			)

			setWeb3AuthModalPack(web3AuthModalPack)

			return () => {
				web3AuthModalPack.unsubscribe(
					ADAPTER_EVENTS.CONNECTED,
					connectedHandler
				)
				web3AuthModalPack.unsubscribe(
					ADAPTER_EVENTS.DISCONNECTED,
					disconnectedHandler
				)
			}
		})()
	}, [])
	useEffect(() => {
		if (web3AuthModalPack && web3AuthModalPack.getProvider()) {
			;(async () => {
				await login()
			})()
		// const txServiceUrl = "https://safe-transaction-goerli.safe.global"
		// const provider = new ethers.providers.Web3Provider(web3AuthModalPack.getProvider() as any)
		// const signer = provider.getSigner()
		// const ethAdapter = new EthersAdapter({
		// 	ethers,
		// 	signerOrProvider: signer || provider
		//   })
		// const safeService = new SafeApiKit({ txServiceUrl, ethAdapter })
		// //const safeFactory = await SafeFactory.create({ ethAdapter: ethAdapter })
		// console.log("info",safeService.getSafeCreationInfo)

		}
	}, [web3AuthModalPack])
	// useEffect(() => {
	// 	if (web3AuthModalPack && web3AuthModalPack.getProvider()) {
	// 		;(async () => {
	// 			await login()
	// 		})();
	// 	async function getSafeInfo() {
	// 		const provider = new ethers.providers.Web3Provider(web3AuthModalPack.getProvider() as any)
	// 		const signer = provider.getSigner()
	// 		const safeService = new SafeApiKit({ txServiceUrl: "https://safe-transaction-goerli.safe.global", ethAdapter: new EthersAdapter({ ethers, signerOrProvider: signer || provider }) })
	// 		const safeInfo = await safeService.getSafeInfo
	// 		console.log("safeInfo", safeInfo)
	// 	}}
	// }, )

	const login = async () => {
		if (!web3AuthModalPack) return

		const signInInfo = await web3AuthModalPack.signIn()
		console.log("SIGN IN RESPONSE: ", signInInfo)

		const userInfo = await web3AuthModalPack.getUserInfo()
		console.log("USER INFO: ", userInfo)

		setSafeAuthSignInResponse(signInInfo)
		setUserInfo(userInfo || undefined)
		setProvider(web3AuthModalPack.getProvider() as SafeEventEmitterProvider)
	}
	const safe = async () => {
		if (!web3AuthModalPack) return
		const txServiceUrl = "https://safe-transaction-goerli.safe.global"
		const provider = new ethers.providers.Web3Provider(web3AuthModalPack.getProvider() as any)
		const signer = provider.getSigner()
		const ethAdapter = new EthersAdapter({
			ethers,
			signerOrProvider: signer || provider
		})
		const safeFactory = await SafeFactory.create({ ethAdapter })
		const owners = [(await signer.getAddress()).toString()]
		const threshold = 1
		const safeAccountConfig: SafeAccountConfig = {
			owners,
			threshold
		}
		const safeSdk: Safe = await safeFactory.deploySafe({ safeAccountConfig })
		console.log("safeSdk", safeSdk)
		const newSafeAddress = await safeSdk.getAddress()
		console.log("newSafeAddress", newSafeAddress)
	}
	//safe()
	const logout = async () => {
		if (!web3AuthModalPack) return

		await web3AuthModalPack.signOut()

		setProvider(null)
		setSafeAuthSignInResponse(null)
	}
	return (
		<>
			<AppBar
				onLogin={login}
				onLogout={logout}
				userInfo={userInfo}
				isLoggedIn={!!provider}
			/>
			{safeAuthSignInResponse?.eoa && (
				<Grid container>
					<Grid item md={4} p={4}>
						<Typography variant="h3" color="secondary" fontWeight={700}>
							Owner account
						</Typography>
						<Divider sx={{ my: 3 }} />
					</Grid>
					<Grid item md={8} p={4}>
						<>
							<Typography variant="h3" color="secondary" fontWeight={700}>
								Available Safes
							</Typography>
							<Divider sx={{ my: 3 }} />
							{safeAuthSignInResponse?.safes?.length ? (
								safeAuthSignInResponse?.safes?.map((safe, index) => (
									<Box sx={{ my: 3 }} key={index}></Box>
								))
							) : (
								<Typography variant="body1" color="secondary" fontWeight={700}>
									No Available Safes
								</Typography>
							)}
						</>
					</Grid>
				</Grid>
			)}
		</>
	)
}
const getPrefix = (chainId: string) => {
	switch (chainId) {
		case "0x1":
			return "eth"
		case "0x5":
			return "gor"
		case "0x100":
			return "gno"
		case "0x137":
			return "matic"
		default:
			return "eth"
	}
}

// 	const options: Web3AuthOptions = {
// 		clientId:
// 			"BMVbCJGKTNafy5v4B8zf6W87bLvV53uP4ZAF5b7u1eKjBJ9hO8tjCrec2PsI5bwPpqqG0_gI6ZtMl1s624Dvo5s",
// 		web3AuthNetwork: "testnet",
// 		chainConfig: {
// 			chainNamespace: CHAIN_NAMESPACES.EIP155,
// 			//chainId: '0x13881',
// 			chainId: "0x5",
// 			//rpcTarget: 'https://polygon-mumbai-bor.publicnode.com'
// 			rpcTarget: "https://rpc.ankr.com/eth_goerli",
// 		},
// 		uiConfig: {
// 			theme: "dark",
// 			loginMethodsOrder: ["google", "facebook"],
// 		},
// 	};

// 	// https://web3auth.io/docs/sdk/pnp/web/modal/initialize#configuring-adapters
// 	const modalConfig = {
// 		[WALLET_ADAPTERS.METAMASK]: {
// 			label: "metamask",
// 			showOnDesktop: true,
// 			showOnMobile: false,
// 		},
// 	};

// 	// https://web3auth.io/docs/sdk/pnp/web/modal/whitelabel#whitelabeling-while-modal-initialization
// 	const openloginAdapter = new OpenloginAdapter({
// 		loginSettings: {
// 			mfaLevel: "mandatory",
// 		},
// 		adapterSettings: {
// 			uxMode: "popup",
// 			whiteLabel: {
// 				name: "Safe",
// 			},
// 		},
// 	});

// 	const web3AuthConfig: Web3AuthConfig = {
// 		txServiceUrl: "https://safe-transaction-goerli.safe.global",
// 	};

// 	// Instantiate and initialize the pack
// 	const web3AuthModalPack = new Web3AuthModalPack(web3AuthConfig);
// 	await web3AuthModalPack.init({
// 		options,
// 		adapters: [openloginAdapter],
// 		modalConfig,
// 	});

// 	const authKitSignData = await web3AuthModalPack.signIn();

// 	web3AuthModalPack.subscribe(ADAPTER_EVENTS.CONNECTED, () => {
// 		console.log("User is authenticated");
// 	});

// 	web3AuthModalPack.subscribe(ADAPTER_EVENTS.DISCONNECTED, () => {
// 		console.log("User is not authenticated");
// 	});

// 	return <div>aaaaaASDLASDLKAJDSLKJAL</div>;
// }
