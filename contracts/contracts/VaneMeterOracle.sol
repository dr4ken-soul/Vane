// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title VaneMeterOracle
/// @notice Anchors physics-verified hourly smart-meter Merkle roots and quarantines
///         spoofed telemetry intervals detected by the PINN satellite verifier.
contract VaneMeterOracle {
    struct MeterBatch {
        bytes32 merkleRoot;
        bytes32 meterId;
        uint64 windowStart;
        uint64 windowEnd;
        uint32 residualSigmaBps; // 10000 = 1.0000 sigma; <= 1200 required for clean anchor
        bool quarantined;
        address reporter;
    }

    address public immutable oracleUpdater;
    uint256 public totalCleanRoots;
    uint256 public totalQuarantinedIntervals;

    mapping(bytes32 => MeterBatch) public batchesByRoot;
    mapping(bytes32 => uint256) public meterQuarantineCount;
    bytes32[] public recentRoots;

    event HourlyRootAnchored(
        bytes32 indexed merkleRoot,
        bytes32 indexed meterId,
        uint32 residualSigmaBps,
        uint64 windowEnd
    );
    event MeterIntervalQuarantined(
        bytes32 indexed meterId,
        bytes32 indexed suspectRoot,
        uint32 residualSigmaBps,
        address indexed reporter
    );

    error UnauthorisedOracle();
    error ResidualExceedsCleanCeiling(uint32 providedBps);
    error RootAlreadyAnchored();

    constructor(address _oracleUpdater) {
        oracleUpdater = _oracleUpdater;
    }

    /// @notice Anchors a verified hourly energy Merkle root whose PINN satellite residual is <= 0.12 sigma.
    /// @param merkleRoot Poseidon2 Merkle root of clean kWh allocations for the window
    /// @param meterId Facility smart-meter identifier hash
    /// @param windowStart Unix start timestamp of telemetry batch
    /// @param windowEnd Unix end timestamp of telemetry batch
    /// @param residualSigmaBps PINN residual in basis points (e.g. 310 = 0.031 sigma)
    function submitHourlyRoot(
        bytes32 merkleRoot,
        bytes32 meterId,
        uint64 windowStart,
        uint64 windowEnd,
        uint32 residualSigmaBps
    ) external {
        if (residualSigmaBps > 1200) revert ResidualExceedsCleanCeiling(residualSigmaBps);
        if (batchesByRoot[merkleRoot].windowEnd != 0) revert RootAlreadyAnchored();

        batchesByRoot[merkleRoot] = MeterBatch({
            merkleRoot: merkleRoot,
            meterId: meterId,
            windowStart: windowStart,
            windowEnd: windowEnd,
            residualSigmaBps: residualSigmaBps,
            quarantined: false,
            reporter: msg.sender
        });

        recentRoots.push(merkleRoot);
        totalCleanRoots += 1;

        emit HourlyRootAnchored(merkleRoot, meterId, residualSigmaBps, windowEnd);
    }

    /// @notice Quarantines a spoofed meter interval on-chain when physics residual exceeds threshold.
    /// @param meterId Facility smart-meter identifier hash
    /// @param suspectRoot Root or batch hash of the spoofed telemetry packet
    /// @param residualSigmaBps Observed PINN residual in basis points (e.g. 4820 = 0.482 sigma)
    function reportAndQuarantine(
        bytes32 meterId,
        bytes32 suspectRoot,
        uint32 residualSigmaBps
    ) external {
        batchesByRoot[suspectRoot] = MeterBatch({
            merkleRoot: suspectRoot,
            meterId: meterId,
            windowStart: uint64(block.timestamp - 3600),
            windowEnd: uint64(block.timestamp),
            residualSigmaBps: residualSigmaBps,
            quarantined: true,
            reporter: msg.sender
        });

        meterQuarantineCount[meterId] += 1;
        totalQuarantinedIntervals += 1;

        emit MeterIntervalQuarantined(meterId, suspectRoot, residualSigmaBps, msg.sender);
    }

    /// @notice Returns true if and only if the facility energy root exists and is not quarantined.
    /// @param merkleRoot Energy root to inspect
    /// @return True when the root is anchored and clean
    function isRootClean(bytes32 merkleRoot) external view returns (bool) {
        MeterBatch memory batch = batchesByRoot[merkleRoot];
        return batch.windowEnd != 0 && !batch.quarantined;
    }

    /// @notice Returns total number of anchored clean roots for live telemetry displays.
    /// @return The count of anchored clean roots
    function getRecentRootsCount() external view returns (uint256) {
        return recentRoots.length;
    }
}
