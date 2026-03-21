import { useEffect, useState } from "react";
import { ethers } from "ethers";
import toast, { Toaster } from 'react-hot-toast';
import "./App.css";

const GOVERNOR = "0xCaB5aF8713c3dF02c6a3cfb285B483EfB774F475";
const TOKEN = "0x052EA31b8cFC29baC68A797e9596725d266Ec6a1";
const OWNER = "0x8d590D721C2B722614753cAdeD9eD9F2Ac7FB347";

const governorAbi = [
    "event ProposalCreated(uint256 id, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)",
    "function propose(address[],uint256[],bytes[],string) returns (uint256)",
    "function castVote(uint256,uint8)",
    "function state(uint256) view returns (uint8)",
    "function proposalVotes(uint256) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
    "function getVotes(address, uint256) view returns (uint256)",
    "function hasVoted(uint256, address) view returns (bool)"
];

const tokenAbi = [
    "function mint(address to, uint256 amount)",
    "function delegate(address)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount)",
    "function delegates(address) view returns (address)"
];

export default function App() {
    const [provider, setProvider] = useState<ethers.BrowserProvider>();
    const [signer, setSigner] = useState<any>();
    const [governor, setGovernor] = useState<any>();
    const [token, setToken] = useState<any>();
    const [account, setAccount] = useState("");
    const [balance, setBalance] = useState("0");
    const [proposals, setProposals] = useState<any[]>([]);
    const [proposalDesc, setProposalDesc] = useState("");
    const [transferTo, setTransferTo] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isDelegated, setIsDelegated] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [totalProposals, setTotalProposals] = useState(0);

    useEffect(() => {
        if (!(window as any).ethereum) return;

        const init = async () => {
            const p = new ethers.BrowserProvider((window as any).ethereum);
            setProvider(p);

            const accounts = await (window as any).ethereum.request({
                method: "eth_accounts"
            });

            if (accounts.length > 0) {
                await connect(p);
            }
        };

        init();
    }, []);

    useEffect(() => {
        if (!governor) return;

        const interval = setInterval(() => {
            loadProposals(governor);
        }, 5000);

        return () => clearInterval(interval);
    }, [governor]);

    const connect = async (providerInstance?: ethers.BrowserProvider) => {
        try {
            setLoading(true);
            setError("");

            const currentProvider = providerInstance || provider;

            const s = await currentProvider.getSigner();
            const addr = await s.getAddress();

            const gov = new ethers.Contract(GOVERNOR, governorAbi, s);
            const tok = new ethers.Contract(TOKEN, tokenAbi, s);

            setSigner(s);
            setGovernor(gov);
            setToken(tok);
            setAccount(addr);
            setIsConnected(true);

            await loadBalance(tok, addr);
            await loadProposals(gov);
            await checkDelegation(tok, addr);

        } catch (err: any) {
            setError(err.message || "Ошибка подключения");
            setIsConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const loadBalance = async (tok: any, addr: string) => {
        try {
            const raw = await tok.balanceOf(addr);
            setBalance(ethers.formatEther(raw));
        } catch (err) {
            setBalance("0");
        }
    };

    const checkDelegation = async (tok: any, addr: string) => {
        try {
            const delegateAddress = await tok.delegates(addr);
            setIsDelegated(delegateAddress === addr);
        } catch (err) {
            console.error("Error checking delegation:", err);
            setIsDelegated(false);
        }
    };

    const loadProposals = async (gov: any) => {
        try {
            const filter = gov.filters.ProposalCreated();
            const events = await gov.queryFilter(filter, 0, "latest");

            const parsed = await Promise.all(
                events.map(async (e: any) => {
                    const id = e.args.id.toString();
                    const description = e.args.description;

                    let state = 0;
                    let votes = { for: 0, against: 0 };
                    let hasVoted = false;

                    try {
                        state = await gov.state(id);

                        const v = await gov.proposalVotes(id);
                        votes = {
                            against: Number(ethers.formatEther(v[0])),
                            for: Number(ethers.formatEther(v[1]))
                        };

                        if (account) {
                            hasVoted = await gov.hasVoted(id, account);
                        }
                    } catch {}

                    return { id, description, state, votes, hasVoted };
                })
            );

            setTotalProposals(parsed.length);
            setProposals(parsed.reverse());
        } catch (err: any) {
            console.error("Error loading proposals:", err);
            setProposals([]);
        }
    };

    const faucet = async () => {
        try {
            setLoading(true);
            const tx = await token.mint(account, ethers.parseEther("10"));
            await tx.wait();
            await loadBalance(token, account);
            toast.success("Mint 10SCM прошёл успешно");
        } catch (err: any) {
            console.error("Mint error:", err);
            setError(err.message || "Ошибка при mint");
        } finally {
            setLoading(false);
        }
    };

    const delegate = async () => {
        try {
            setLoading(true);
            const tx = await token.delegate(account);
            await tx.wait();
            await checkDelegation(token, account);
            toast.success("Теперь вы можете голосовать!")
        } catch (err: any) {
            console.error("Delegate error:", err);
            setError(err.message || "Ошибка при делегировании");
        } finally {
            setLoading(false);
        }
    };

    const requestMoney = () => {
        const message = `Send me SCM please:\n \`${account}\``;
        const url = `https://t.me/pochtineploho?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    };

    const transfer = async () => {
        try {
            setLoading(true);
            const tx = await token.transfer(
                transferTo,
                ethers.parseEther(transferAmount)
            );
            await tx.wait();
            await loadBalance(token, account);
            setTransferTo("");
            setTransferAmount("");
            toast.success("Перевод успешно выполнен")
        } catch (err: any) {
            console.error("Transfer error:", err);
            setError(err.message || "Ошибка при переводе");
        } finally {
            setLoading(false);
        }
    };

    const getStateName = (s: number) => {
        const states = [
            "Ожидание",
            "Активно",
            "Отменено",
            "Не принято",
            "Принято",
            "В очереди",
            "Истекло",
            "Выполнено"
        ];
        return states[s] || `Неизвестно (${s})`;
    };

    const canVote = (state: number, hasVoted: boolean) => {
        return Number(state) === 1 && !hasVoted;
    };

    const getVotingStatusMessage = (state: number, hasVoted: boolean) => {
        if (hasVoted) return "Вы уже проголосовали";
        if (Number(state) == 0) return `Голосование ещё не началось`;
        if (Number(state) !== 1) return `Голосование уже закончилось`;
        return "";
    };

    const createProposal = async () => {
        try {
            setLoading(true);
            const tx = await governor.propose(
                [account],
                [0],
                ["0x"],
                proposalDesc
            );
            await tx.wait();
            await loadProposals(governor);
            setProposalDesc("");
            toast.success("Предложение создано")
        } catch (err: any) {
            console.error("Create proposal error:", err);
            setError(err.message || "Ошибка при создании предложения");
        } finally {
            setLoading(false);
        }
    };

    const vote = async (id: string, type: number) => {
        try {
            setLoading(true);
            const tx = await governor.castVote(id, type);
            await tx.wait();
            await loadProposals(governor);
            toast.success(`Голос ${type === 1 ? "ЗА" : "ПРОТИВ"} учтён`)
        } catch (err: any) {
            console.error("Vote error:", err);
            setError(err.message || "Ошибка при голосовании");
        } finally {
            setLoading(false);
        }
    };

    const shortId = (id: string) =>
        id.slice(0, 6) + "..." + id.slice(-4);

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProposals = proposals.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(proposals.length / itemsPerPage);

    const paginate = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (!isConnected) {
        return (
            <div className="app">
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                        success: {
                            style: {
                                background: '#10b981',
                            },
                        },
                        error: {
                            style: {
                                background: '#ef4444',
                            },
                        },
                    }}
                />
                <h1>🚀 DAO</h1>
                {error && <div className="error">{error}</div>}
                <button onClick={() => connect()} disabled={loading}>
                    {loading ? "Подключение..." : "Подключить кошелёк"}
                </button>
            </div>
        );
    }

    return (
        <div className="app">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        style: {
                            background: '#10b981',
                        },
                    },
                    error: {
                        style: {
                            background: '#ef4444',
                        },
                    },
                }}
            />
            <div className="container">
                <h1>🚀 Cryptoscam 2.1 DAO</h1>

                {error && <div className="error">{error}</div>}

                <div className="card">
                    <p><b>Адрес:</b> {account}</p>
                    <p><b>Баланс:</b> {balance} SCM</p>
                    {isDelegated && (
                        <p className="delegated-info">✓ Голоса делегированы себе</p>
                    )}
                </div>

                <div className="card">
                    <h2>💰 Токен</h2>

                    {account.toLowerCase() === OWNER.toLowerCase() && (
                        <button onClick={faucet}>Mint 10 SCM</button>
                    )}

                    <button onClick={requestMoney} className="telegram">
                        Попросить токенов
                    </button>

                    {!isDelegated && (
                        <button onClick={delegate}>
                            Делегировать себе голоса
                        </button>
                    )}
                </div>

                <div className="card">
                    <h2>Перевести</h2>

                    <input
                        placeholder="Адрес"
                        value={transferTo}
                        onChange={(e) => setTransferTo(e.target.value)}
                    />

                    <input
                        placeholder="Сумма"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                    />

                    <button onClick={transfer}>
                        Отправить
                    </button>
                </div>

                <div className="card">
                    <h2>Создать предложение</h2>

                    <input
                        placeholder="Описание"
                        value={proposalDesc}
                        onChange={(e) => setProposalDesc(e.target.value)}
                    />

                    <button onClick={createProposal}>
                        Создать
                    </button>
                </div>

                <div className="card">
                    <h2>Предложения</h2>

                    {proposals.length === 0 ? (
                        <p className="no-proposals">Нет активных предложений</p>
                    ) : (
                        <>
                            {currentProposals.map((p) => (
                                <div key={p.id} className="proposal">
                                    <div className="proposal-header">
                                        <div className="id">
                                            {shortId(p.id)}
                                            <button onClick={() => copy(p.id)} className="copy">
                                                📋
                                            </button>
                                        </div>

                                        <span className={`status status-${p.state}`}>
                                            {getStateName(p.state)}
                                        </span>
                                    </div>

                                    <p className="description">{p.description}</p>

                                    <div className="votes-info">
                                        <p className="votes">
                                            👍 {p.votes.for} | 👎 {p.votes.against}
                                        </p>
                                        <p className="vote-status">
                                            {getVotingStatusMessage(p.state, p.hasVoted)}
                                        </p>
                                    </div>

                                    <div className="actions">
                                        <button
                                            onClick={() => vote(p.id, 1)}
                                            className="yes"
                                            disabled={!canVote(p.state, p.hasVoted)}
                                            title={!canVote(p.state, p.hasVoted) ? getVotingStatusMessage(p.state, p.hasVoted) : "Голосовать ЗА"}
                                        >
                                            👍
                                        </button>

                                        <button
                                            onClick={() => vote(p.id, 0)}
                                            className="no"
                                            disabled={!canVote(p.state, p.hasVoted)}
                                            title={!canVote(p.state, p.hasVoted) ? getVotingStatusMessage(p.state, p.hasVoted) : "Голосовать ПРОТИВ"}
                                        >
                                            👎
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="page-btn"
                                    >
                                        ← Назад
                                    </button>

                                    <div className="page-numbers">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                onClick={() => paginate(pageNum)}
                                                className={`page-num ${currentPage === pageNum ? 'active' : ''}`}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="page-btn"
                                    >
                                        Вперёд →
                                    </button>
                                </div>
                            )}

                            <div className="proposals-info">
                                Показано {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, proposals.length)} из {proposals.length} предложений
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}