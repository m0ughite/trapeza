// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IArcTaskAgentRegistry {
    function getAgentOwner(uint256 agentId) external view returns (address);
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * ERC-20 USDC variant of ArcTaskEscrow for Trapeza integration.
 * Uses transferFrom against Arc testnet USDC (0x3600..., 6 decimals) instead of msg.value.
 */
contract ArcTaskEscrowErc20 {
    enum JobStatus {
        Funded,
        Submitted,
        Accepted,
        Rejected,
        Refunded
    }

    struct Job {
        address client;
        uint256 agentId;
        address agentOwner;
        address evaluator;
        uint256 rewardAmount;
        uint64 deadline;
        string jobURI;
        bytes32 deliverableHash;
        JobStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    IArcTaskAgentRegistry public immutable registry;
    IERC20 public immutable usdc;
    uint256 public nextJobId = 1;
    mapping(uint256 => Job) public jobs;
    bool private locked;

    event JobCreated(
        uint256 indexed jobId,
        uint256 indexed agentId,
        address indexed client,
        address evaluator,
        uint256 rewardAmount,
        uint64 deadline,
        string jobURI
    );
    event DeliverableSubmitted(uint256 indexed jobId, bytes32 deliverableHash);
    event WorkAccepted(uint256 indexed jobId, address indexed agentOwner, uint256 rewardAmount);
    event WorkRejected(uint256 indexed jobId, address indexed client, uint256 rewardAmount);
    event JobRefunded(uint256 indexed jobId, address indexed client, uint256 rewardAmount);

    constructor(address registryAddress, address usdcAddress) {
        require(registryAddress != address(0), "registry required");
        require(usdcAddress != address(0), "usdc required");
        registry = IArcTaskAgentRegistry(registryAddress);
        usdc = IERC20(usdcAddress);
    }

    modifier nonReentrant() {
        require(!locked, "reentrant call");
        locked = true;
        _;
        locked = false;
    }

    function createJob(
        uint256 agentId,
        uint256 rewardAmount,
        uint64 deadline,
        address evaluator,
        string calldata jobURI
    ) external returns (uint256 jobId) {
        require(rewardAmount > 0, "reward required");
        require(deadline > block.timestamp, "deadline in past");
        require(evaluator != address(0), "evaluator required");
        require(bytes(jobURI).length != 0, "job uri required");
        require(
            usdc.transferFrom(msg.sender, address(this), rewardAmount),
            "usdc transfer failed"
        );

        address agentOwner = registry.getAgentOwner(agentId);

        jobId = nextJobId++;
        jobs[jobId] = Job({
            client: msg.sender,
            agentId: agentId,
            agentOwner: agentOwner,
            evaluator: evaluator,
            rewardAmount: rewardAmount,
            deadline: deadline,
            jobURI: jobURI,
            deliverableHash: bytes32(0),
            status: JobStatus.Funded,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit JobCreated(jobId, agentId, msg.sender, evaluator, rewardAmount, deadline, jobURI);
    }

    function submitDeliverable(uint256 jobId, bytes32 deliverableHash) external {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Funded, "not funded");
        require(msg.sender == job.agentOwner, "not agent owner");
        require(deliverableHash != bytes32(0), "hash required");

        job.deliverableHash = deliverableHash;
        job.status = JobStatus.Submitted;
        job.updatedAt = block.timestamp;

        emit DeliverableSubmitted(jobId, deliverableHash);
    }

    function acceptWork(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Submitted, "not submitted");
        require(msg.sender == job.evaluator, "not evaluator");

        job.status = JobStatus.Accepted;
        job.updatedAt = block.timestamp;
        require(usdc.transfer(job.agentOwner, job.rewardAmount), "usdc payout failed");

        emit WorkAccepted(jobId, job.agentOwner, job.rewardAmount);
    }

    function rejectWork(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Submitted, "not submitted");
        require(msg.sender == job.evaluator, "not evaluator");

        job.status = JobStatus.Rejected;
        job.updatedAt = block.timestamp;
        require(usdc.transfer(job.client, job.rewardAmount), "usdc refund failed");

        emit WorkRejected(jobId, job.client, job.rewardAmount);
    }

    function refundExpired(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Funded || job.status == JobStatus.Submitted, "not active");
        require(msg.sender == job.client, "not client");
        require(block.timestamp > job.deadline, "not expired");

        job.status = JobStatus.Refunded;
        job.updatedAt = block.timestamp;
        require(usdc.transfer(job.client, job.rewardAmount), "usdc refund failed");

        emit JobRefunded(jobId, job.client, job.rewardAmount);
    }
}
