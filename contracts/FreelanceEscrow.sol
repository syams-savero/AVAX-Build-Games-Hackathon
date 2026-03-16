// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FreelanceEscrow {
    enum Status { Open, Assigned, Submitted, Completed, Cancelled }
    enum WithdrawalState { NotRequested, Requested, Withdrawn }

    struct Project {
        address client;
        address freelancer;
        uint256 budget;
        string title;
        string requirements;
        string githubUrl;
        Status status;
        WithdrawalState withdrawalState;
        uint256 createdAt;
        uint256 timeout;
    }

    mapping(uint256 => Project) public projects;
    uint256 public projectCount;
    address public owner;

    event ProjectCreated(uint256 id, address client, uint256 budget, string title);
    event FreelancerAssigned(uint256 id, address freelancer);
    event WorkSubmitted(uint256 id, string githubUrl);
    event PaymentReleased(uint256 id, address freelancer, uint256 amount);
    event ProjectCancelled(uint256 id, address client, uint256 amount);
    event WithdrawalRequested(uint256 id, address client);
    event WithdrawalProcessed(uint256 id, address client, uint256 amount);
    event OwnershipTransferred(address previousOwner, address newOwner);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyClient(uint256 id) {
        require(msg.sender == projects[id].client, "Only client");
        _;
    }

    modifier onlyFreelancer(uint256 id) {
        require(msg.sender == projects[id].freelancer, "Only freelancer");
        _;
    }

    modifier projectExists(uint256 id) {
        require(id < projectCount, "Project does not exist");
        _;
    }

    modifier validProjectStatus(uint256 id, Status status) {
        require(projects[id].status == status, "Invalid project status");
        _;
    }

    function createProject(
        string memory title,
        string memory requirements,
        uint256 timeoutDuration
    ) external payable returns (uint256) {
        require(msg.value > 0, "Budget required");
        uint256 id = projectCount++;
        projects[id] = Project({
            client: msg.sender,
            freelancer: address(0),
            budget: msg.value,
            title: title,
            requirements: requirements,
            githubUrl: "",
            status: Status.Open,
            withdrawalState: WithdrawalState.NotRequested,
            createdAt: block.timestamp,
            timeout: block.timestamp + timeoutDuration
        });
        emit ProjectCreated(id, msg.sender, msg.value, title);
        return id;
    }

    function assignFreelancer(
        uint256 id,
        address freelancer
    ) external projectExists(id) onlyClient(id) validProjectStatus(id, Status.Open) {
        projects[id].freelancer = freelancer;
        projects[id].status = Status.Assigned;
        emit FreelancerAssigned(id, freelancer);
    }

    function submitWork(
        uint256 id,
        string memory githubUrl
    ) external projectExists(id) onlyFreelancer(id) validProjectStatus(id, Status.Assigned) {
        projects[id].githubUrl = githubUrl;
        projects[id].status = Status.Submitted;
        emit WorkSubmitted(id, githubUrl);
    }

    function releasePayment(uint256 id) external projectExists(id) onlyClient(id) validProjectStatus(id, Status.Submitted) {
        projects[id].status = Status.Completed;
        uint256 amount = projects[id].budget;
        projects[id].budget = 0;

        (bool success, ) = payable(projects[id].freelancer).call{value: amount}("");
        require(success, "Transfer failed");

        emit PaymentReleased(id, projects[id].freelancer, amount);
    }

    function cancelProject(uint256 id) external projectExists(id) onlyClient(id) {
        require(projects[id].status == Status.Open || projects[id].status == Status.Assigned, "Cannot cancel project");
        projects[id].status = Status.Cancelled;
        uint256 amount = projects[id].budget;
        projects[id].budget = 0;

        (bool success, ) = payable(projects[id].client).call{value: amount}("");
        require(success, "Transfer failed");

        emit ProjectCancelled(id, projects[id].client, amount);
    }

    function requestWithdrawal(uint256 id) external projectExists(id) onlyClient(id) {
        require(projects[id].status == Status.Submitted, "Cannot request withdrawal");
        require(projects[id].withdrawalState == WithdrawalState.NotRequested, "Withdrawal already requested");
        projects[id].withdrawalState = WithdrawalState.Requested;
        emit WithdrawalRequested(id, projects[id].client);
    }

    function processWithdrawal(uint256 id) external projectExists(id) onlyClient(id) {
        require(projects[id].status == Status.Submitted, "Cannot process withdrawal");
        require(projects[id].withdrawalState == WithdrawalState.Requested, "Withdrawal not requested");
        require(block.timestamp > projects[id].timeout, "Timeout not reached");

        uint256 amount = projects[id].budget;
        projects[id].budget = 0;
        projects[id].withdrawalState = WithdrawalState.Withdrawn;

        (bool success, ) = payable(projects[id].client).call{value: amount}("");
        require(success, "Transfer failed");

        emit WithdrawalProcessed(id, projects[id].client, amount);
    }

    function getProject(uint256 id) external view projectExists(id) returns (Project memory) {
        return projects[id];
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

function withdrawFunds() external onlyOwner {

    uint256 amount = address(this).balance;

    (bool success, ) = payable(owner).call{value: amount}("");

    require(success, "Withdraw failed");
}

    receive() external payable {}
}