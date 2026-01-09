import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { useIframe } from "../../IframeContext";
import {
  getRequest,
  updateRequest,
  createAcceptedNegotiationFromRequest,
  getNegotiationByRequestId,
  redirectToNegotiationDisplay,
  createContractAPI,
  getRequests,
} from "../../services/api";
import { getRequestPermissions } from "../../utils/policyParser";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import log from "loglevel";

log.setLevel("debug");

// css
import styles from "../../css/Ontology.module.css";

// components
import LoadingSpinner from "../LoadingSpinner";

interface Refinement {
  attribute: string;
  instance: string;
  value: string;
}

interface Permission {
  dataset: string;
  datasetRefinements: Refinement[];
  action: string;
  actionRefinements: Refinement[];
  purpose: string;
  purposeRefinements: Refinement[];
  constraintRefinements: Refinement[];
  constraints?: Array<{
    leftOperand: string;
    operator: string;
    rightOperand: any;
    description: string;
  }>;
  assignees?: Array<{
    source: string;
    refinements?: Array<{
      leftOperand: string;
      operator: string;
      rightOperand: any;
      description: string;
    }>;
  }>;
}

interface Request {
  id: string;
  requestName: string;
  requester: {
    requesterId: string;
    requesterName: string;
    requesterEmail: string;
  };
  permissions: Permission[];
  policy?: any; // ODRL policy
  status: string;
  ownersAccepted: string[];
  ownersRejected: string[];
  ownersPending: string[];
}

function OwnerPendingRequestsDetails() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate(); // Initialize useNavigate
  const { isIframeMode, notifyParent } = useIframe();
  const [requestDetails, setRequestDetails] = useState<Request | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);
  const [negotiationInfo, setNegotiationInfo] = useState<any>(null);
  const [checkingNegotiation, setCheckingNegotiation] =
    useState<boolean>(false);
  const [autoRedirectAttempted, setAutoRedirectAttempted] =
    useState<boolean>(false);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!requestId) {
        setError("Invalid request ID.");
        setLoading(false);
        return;
      }

      try {
        const result = await getRequest(requestId);

        if (result.success) {
          setRequestDetails(result.data as Request);

          // Check if there's an existing negotiation for this request
          try {
            const negotiationResult = await getNegotiationByRequestId(
              requestId
            );
            if (negotiationResult.success && negotiationResult.negotiationId) {
              setNegotiationInfo(negotiationResult);
              console.log("📋 Found existing negotiation:", negotiationResult);

              // Debug iframe and redirect conditions
              console.log("🔍 Auto-redirect conditions check:", {
                isIframeMode,
                autoRedirectAttempted,
                hasNegotiationId: !!negotiationResult.negotiationId,
                userExists: !!user,
                hasMongoUserId: !!user?.userData?.mongoUserId,
                shouldAutoRedirect: isIframeMode && !autoRedirectAttempted,
              });

              // Auto-redirect to negotiation in iframe mode (only if not already attempted)
              if (
                user?.loginSource === "External/API" &&
                !autoRedirectAttempted
              ) {
                console.log(
                  "🔄 Auto-redirecting to existing negotiation in iframe mode..."
                );
                setAutoRedirectAttempted(true);

                // Get user info and redirect immediately
                const authUser = user;
                if (authUser && authUser.userData?.mongoUserId) {
                  const accessToken =
                    authUser?.apiToken || localStorage.getItem("token");

                  if (accessToken) {
                    console.log(
                      "🚀 Auto-redirecting with provider token in iframe mode"
                    );
                    const userType =
                      authUser.role === "owner" ? "provider" : "consumer";

                    try {
                      await redirectToNegotiationDisplay(
                        negotiationResult.negotiationId,
                        accessToken,
                        authUser.userData.mongoUserId,
                        userType
                      );

                      // Notify parent that we're redirecting
                      notifyParent({
                        action: "negotiation_redirect",
                        negotiationId: negotiationResult.negotiationId,
                        requestId: requestId,
                      });

                      return; // Exit early since we're redirecting
                    } catch (redirectError) {
                      console.error("❌ Auto-redirect failed:", redirectError);
                      // Continue with normal flow if redirect fails
                    }
                  } else {
                    console.warn("⚠️ No token available for auto-redirect");
                  }
                } else {
                  console.warn("⚠️ No user info available for auto-redirect");
                }
              }
            }
          } catch (negotiationError) {
            console.log("ℹ️ No existing negotiation found for this request");
          }
        } else {
          setError("Request not found.");
        }

        setLoading(false);
      } catch (error) {
        setError("Error fetching request details.");
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId]);

  const { user } = useAuth();

  // Separate effect for auto-redirect when user and negotiation info are both available
  useEffect(() => {
    // Add small delay to ensure iframe mode is properly detected
    const checkAndRedirect = () => {
      if (isIframeMode && negotiationInfo && user && !autoRedirectAttempted) {
        console.log("🔄 Triggering auto-redirect effect...");
        console.log("🔍 Auto-redirect conditions check (separate effect):", {
          isIframeMode,
          hasNegotiationInfo: !!negotiationInfo,
          hasUser: !!user,
          hasMongoUserId: !!user?.userData?.mongoUserId,
          autoRedirectAttempted,
          negotiationId: negotiationInfo.negotiationId,
        });

        setAutoRedirectAttempted(true);

        const performAutoRedirect = async () => {
          if (user.userData?.mongoUserId) {
            const accessToken = user?.apiToken || localStorage.getItem("token");

            if (accessToken) {
              console.log(
                "🚀 Performing auto-redirect with provider token in iframe mode"
              );
              // const userType = user.role === "owner" ? "provider" : "consumer";

              try {
                // Notify parent that we're opening negotiation in new tab
                notifyParent({
                  action: "negotiation_opened",
                  negotiationId: negotiationInfo.negotiationId,
                  requestId: requestId,
                  method: "new_tab",
                });

                // Small delay to ensure parent gets the message
                await new Promise((resolve) => setTimeout(resolve, 500));

              } catch (redirectError) {
                console.error("❌ Auto-redirect failed:", redirectError);
                setAutoRedirectAttempted(false); // Allow retry

                // Show error message if tab was blocked
                if (
                  typeof redirectError === "object" &&
                  redirectError !== null &&
                  "message" in redirectError
                ) {
                  if (
                    (redirectError as { message: string }).message.includes(
                      "blocked"
                    )
                  ) {
                    setError(
                      'Please click "Open Negotiation Manually" below or check your browser\'s pop-up blocker settings.'
                    );
                  }
                }
              }
            } else {
              console.warn("⚠️ No token available for auto-redirect");
            }
          } else {
            console.warn("⚠️ No MongoDB user ID available for auto-redirect");
          }
        };

        performAutoRedirect();
      }
    };

    // Use a small timeout to ensure all context is ready
    const timeoutId = setTimeout(checkAndRedirect, 100);

    return () => clearTimeout(timeoutId);
  }, [
    isIframeMode,
    negotiationInfo,
    user,
    autoRedirectAttempted,
    requestId,
    notifyParent,
  ]);

  // Cleanup: Remove modal-open class when component unmounts
  useEffect(() => {
    return () => {
      // Remove modal-open class from body
      document.body.classList.remove("modal-open");
      // Remove any lingering modal backdrops
      const backdrops = document.getElementsByClassName("modal-backdrop");
      while (backdrops.length > 0) {
        backdrops[0].remove();
      }
    };
  }, []);

  // getting the mongodb consumer id
  async function getConsumerMongoId(
    requesterId: string
  ): Promise<string | null> {
    const docRef = doc(db, "requesters", requesterId);
    console.log("Path being read:", docRef.path);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return snapshot.data().mongoUserId || null;
  }

  function formatOperand(operand: any): string {
    if (!operand) return "";

    if (typeof operand === "string") return operand;

    // JSON-LD object with @id
    if (operand["@id"]) {
      return operand["@id"].replace(/^.*:/, ""); // strip prefix like cactus:
    }

    // JSON-LD object with @value
    if (operand["@value"]) {
      return operand["@value"];
    }

    // JSON-LD object with @list
    if (operand["@list"]) {
      return operand["@list"]
        .map((item: any) => formatOperand(item))
        .join(", ");
    }

    // Plain array of objects
    if (Array.isArray(operand)) {
      return operand.map((item) => formatOperand(item)).join(", ");
    }

    return String(operand);
  }

  // Function to redirect to negotiation display
  const viewNegotiation = async () => {
    if (!negotiationInfo?.negotiationId || !user) {
      console.error("❌ Missing negotiation ID or user info");
      return;
    }

    setCheckingNegotiation(true);

    try {
      // Get the auth token from provider's context instead of localStorage
      const accessToken = user?.apiToken || localStorage.getItem("token");

      if (!accessToken) {
        setError("No authentication token found for provider");
        setCheckingNegotiation(false);
        return;
      }

      console.log("🔑 Using provider token for negotiation view");

      // Get MongoDB user ID (we know the user has one since they can approve)
      const mongoUserId = user.userData?.mongoUserId;

      if (!mongoUserId) {
        setError("MongoDB user ID not found. Please contact support.");
        setCheckingNegotiation(false);
        return;
      }

      // Determine user type based on role
      const userType = user.role === "owner" ? "provider" : "consumer";

      console.log("🔗 Redirecting to negotiation with:", {
        negotiationId: negotiationInfo.negotiationId,
        mongoUserId,
        userType,
      });

      // Redirect to negotiation display (now async)
      await redirectToNegotiationDisplay(
        negotiationInfo.negotiationId,
        accessToken,
        mongoUserId,
        userType
      );
    } catch (error) {
      console.error("❌ Error redirecting to negotiation:", error);
      setError("Failed to open negotiation. Please try again.");
      setCheckingNegotiation(false);
    }
  };

  // Negotiate Request
  const negotiateRequest = async () => {
    console.log("🔄 Starting approval process...");

    if (!requestDetails || !user) {
      console.error("❌ Missing requestDetails or user:", {
        requestDetails: !!requestDetails,
        user: !!user,
      });
      return;
    }

    console.log(
      "✅ Request details and user available, proceeding with approval"
    );
    setUpdating(true);

    try {
      const loggedInUserId = user.uid;
      console.log("👤 Logged in user ID:", loggedInUserId);

      // Check for existing negotiation or create a new one if requester info is available
      if (requestDetails.requester?.requesterId) {
        // First check if there's already an existing negotiation
        if (negotiationInfo?.negotiationId) {
          console.log(
            "📋 Using existing negotiation:",
            negotiationInfo.negotiationId
          );

          // Redirect to existing negotiation if in iframe mode (user has loged in through the API)
          if (
            user.loginSource === "External/API" &&
            user.userData?.mongoUserId
          ) {
            console.log(
              "🔗 Redirecting to existing negotiation (iframe mode)..."
            );

            // Use provider's token from AuthContext instead of localStorage
            const negotiationToken =
              user?.apiToken || localStorage.getItem("token");
            if (negotiationToken) {
              console.log(
                "🔑 Using provider token for existing negotiation redirect"
              );
              closeModal("approveRequestModal");

              const userType = user.role === "owner" ? "provider" : "consumer";
              await redirectToNegotiationDisplay(
                negotiationInfo.negotiationId,
                negotiationToken,
                user.userData.mongoUserId,
                userType
              );
              return; // Exit early to avoid further processing
            } else {
              console.warn(
                "⚠️ No authentication token found for provider redirect"
              );
            }
          }
        } else {
          const providerMongoId = user.userData?.mongoUserId;

          if (providerMongoId) {
            if (!user) {
              console.error("User not authenticated, cannot fetch requester");
              return;
            }

            console.log("✅ Using UID from useAuth:", user.uid);

            const consumerId = await getConsumerMongoId(
              requestDetails.requester.requesterId
            );
            console.log("🤝 Creating new accepted negotiation...", {
              consumerId,
              providerId: providerMongoId,
            });

            try {
              console.log("🚀 === STARTING FRONTEND NEGOTIATION CREATION ===");
              console.log("📋 Request details for negotiation:", {
                requestId: requestId,
                requestName: requestDetails.requestName,
                consumerId,
                providerId: providerMongoId,
                userDisplayName: user.displayName,
                userEmail: user.email,
              });

              // Get the authentication token from the provider's context (not localStorage)
              let negotiationToken: string | undefined =
                user?.apiToken || undefined;

              // 🔽 Handle case where apiToken might be a JSON string containing access_token
              if (
                typeof negotiationToken === "string" &&
                negotiationToken.startsWith("{")
              ) {
                try {
                  const parsed = JSON.parse(negotiationToken);
                  negotiationToken = parsed.access_token || negotiationToken;
                  console.log("✅ Extracted access_token from apiToken JSON");
                } catch (e) {
                  console.warn(
                    "⚠️ Could not parse apiToken JSON, using raw value"
                  );
                }
              } else if (
                typeof negotiationToken !== "string" &&
                negotiationToken
              ) {
                // Handle object case
                if ((negotiationToken as any).access_token) {
                  negotiationToken = (negotiationToken as any).access_token;
                } else {
                  console.warn(
                    "⚠️ negotiationToken is not a string and has no access_token:",
                    negotiationToken
                  );
                  negotiationToken = undefined;
                }
              }

              console.log("🔑 Token retrieval:", {
                hasApiToken: !!negotiationToken,
                apiTokenLength: negotiationToken?.length || 0,
                hasUserObject: !!user,
                userUid: user?.uid,
              });

              if (!negotiationToken) {
                console.warn(
                  "⚠️ No provider token in AuthContext, falling back to localStorage"
                );

                const fallbackToken = localStorage.getItem("token");

                if (fallbackToken && fallbackToken.startsWith("{")) {
                  try {
                    const parsed = JSON.parse(fallbackToken);
                    negotiationToken = parsed.access_token || undefined;
                    console.log(
                      "✅ Extracted access_token from localStorage JSON"
                    );
                  } catch (e) {
                    console.warn(
                      "⚠️ Could not parse fallback token JSON, using raw value"
                    );
                    negotiationToken = fallbackToken;
                  }
                } else {
                  negotiationToken = fallbackToken || undefined;
                }

                console.log("🔑 Fallback token check:", {
                  hasFallbackToken: !!negotiationToken,
                  fallbackTokenLength: negotiationToken?.length || 0,
                });

                if (!negotiationToken) {
                  throw new Error("No authentication token found for provider");
                }
              }

              console.log("🔑 Auth token is: ", negotiationToken);
              console.log(
                "📤 Making API call to createAcceptedNegotiationFromRequest..."
              );

              if (!consumerId) {
                throw new Error("Consumer Mongo ID not found");
              }

              const negotiationResult =
                await createAcceptedNegotiationFromRequest(
                  requestId!,
                  consumerId, // Consumer ID
                  providerMongoId, // Provider ID (the approving owner's MongoDB ID)
                  negotiationToken
                );

              console.log("📤 creteaccept failed");
              console.log("📥 Negotiation creation API response:", {
                success: negotiationResult.success,
                hasNegotiation: !!negotiationResult.negotiation,
                negotiationId:
                  negotiationResult.negotiation?.negotiation_id ||
                  negotiationResult.negotiation?.id,
                message: negotiationResult.message,
                error: negotiationResult.error,
              });

              if (negotiationResult.success) {
                console.log(
                  "✅ Accepted negotiation created successfully:",
                  negotiationResult.negotiation
                );

                // Update local negotiation info
                const newNegotiationInfo = {
                  success: true,
                  negotiationId: negotiationResult.negotiation?.negotiation_id,
                  negotiationStatus: "requested", // to double check the status we need
                };

                setNegotiationInfo(newNegotiationInfo);

                console.log(newNegotiationInfo);

                // Redirect immediately to the negotiation display
                if (
                  user.loginSource === "UI" ||
                  user.loginSource === "External/API"
                ) {
                  const negotiationId =
                    negotiationResult.negotiation?.negotiation_id;
                  if (negotiationId && user.userData?.mongoUserId) {
                    console.log("🚀 Redirecting with:", {
                      negotiationId: negotiationId,
                      mongoUserId: user.userData?.mongoUserId,
                      userType: user.role,
                      apiToken: user?.apiToken,
                      localStorageToken: localStorage.getItem("token"),
                    });

                    closeModal("negotiateRequestModal");

                    // Notify parent window about negotiation if in iframe mode
                    if (isIframeMode) {
                      console.log(
                        "📡 Notifying parent window about negotiation"
                      );
                      notifyParent({
                        action: "negotiation_opened",
                        negotiationId: negotiationId,
                        requestId: requestId,
                        method:
                          user.loginSource === "External/API"
                            ? "new_tab"
                            : "redirect",
                      });
                    }

                    const userType =
                      user.role === "owner" ? "provider" : "consumer";
                    await redirectToNegotiationDisplay(
                      negotiationId,
                      negotiationToken,
                      user.userData.mongoUserId,
                      userType
                    );
                    return; // Exit early to avoid further processing
                  } else {
                    console.warn(
                      "⚠️ Missing negotiation ID or MongoDB user ID for redirect"
                    );
                  }
                }
              } else {
                console.warn(
                  "⚠️ Failed to create accepted negotiation:",
                  negotiationResult.error
                );
                // Continue with approval process even if negotiation creation fails
              }
            } catch (negotiationError) {
              console.warn(
                "❌ Error creating accepted negotiation:",
                negotiationError
              );
              // Continue with approval process even if negotiation creation fails
            }
          } else {
            console.warn(
              "⚠️ Cannot create negotiation without provider mongoDB ID. Continuing with approval."
            );
          }
        }
      } else {
        console.warn("⚠️ No requester info available for negotiation creation");
      }

      console.log("🔄 Closing modal and finalizing approval...");
      closeModal("approveRequestModal");

      // Notify parent window if in iframe mode
      if (isIframeMode) {
        console.log("📡 Notifying parent window about approval");
        notifyParent({
          action: "request_approved",
          requestId: requestId,
          requestName: requestDetails.requestName,
        });
      }

      // Navigate to dashboard only if not in iframe mode
      if (!isIframeMode) {
        console.log("🏠 Navigating to dashboard");
        navigate("/ownerBase/ownerDashboard");
      }
    } catch (error) {
      console.error("❌ Error in approval process:", error);
      setError("Error approving request.");
    }

    console.log("✅ Approval process completed, setting updating to false");
    setUpdating(false);
  };

  // Reject Request
  const rejectRequest = async () => {
    if (!requestDetails || !user) return;

    setUpdating(true);
    try {
      const loggedInUserId = user.uid;

      // Remove the logged-in user's ID from ownersPending array
      const updatedOwnersPending = requestDetails.ownersPending.filter(
        (ownerId) => ownerId !== loggedInUserId
      );

      // Add the logged-in user's ID to the ownersRejected array
      const updatedOwnersRejected = [
        ...requestDetails.ownersRejected,
        loggedInUserId,
      ];

      // Update request with new ownersPending, ownersRejected, and status
      const result = await updateRequest(requestId!, {
        ownersPending: updatedOwnersPending,
        ownersRejected: updatedOwnersRejected,
        status: "rejected", // ✅ mark request as rejected
      });

      if (result.success) {
        // Update the state with the new values
        setRequestDetails(
          (prev) =>
            prev && {
              ...prev,
              ownersPending: updatedOwnersPending,
              ownersRejected: updatedOwnersRejected,
              status: "rejected", // ✅ update local state too
            }
        );

        closeModal("rejectRequestModal");

        // Notify parent window if in iframe mode
        if (isIframeMode) {
          // Notify parent window about rejection
          notifyParent({
            action: "request_rejected",
            requestId: requestId,
            requestName: requestDetails.requestName,
          });
        }

        // Navigate to dashboard only if not in iframe mode
        if (!isIframeMode) {
          navigate("/ownerBase/ownerDashboard");
        }
      } else {
        setError("Error rejecting request.");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      setError("Error rejecting request.");
    }
    setUpdating(false);
  };

  // accept request
  const acceptRequest = async () => {
    if (!requestDetails || !user) return;

    log.info("test");

    const requestsResult = await getRequests({
      uid: user.uid,
      role: user.role,
    });
    const userRequestsCount = requestsResult.data?.length || 0;

    setUpdating(true);
    try {
      const loggedInUserId = user.uid;

      const updatedOwnersPending = requestDetails.ownersPending.filter(
        (ownerId) => ownerId !== loggedInUserId
      );
      const updatedOwnersAccepted = [
        ...requestDetails.ownersAccepted,
        loggedInUserId,
      ];

      // Update request with new arrays AND status
      const result = await updateRequest(requestId!, {
        ownersPending: updatedOwnersPending,
        ownersAccepted: updatedOwnersAccepted,
        status: "accepted",
      });

      if (result.success) {
        const updatedRequest = {
          ...requestDetails,
          ownersPending: updatedOwnersPending,
          ownersAccepted: updatedOwnersAccepted,
          status: "accepted",
        };
        setRequestDetails(updatedRequest);
        closeModal("acceptRequestModal");

        // Call the contract API
        try {
          const contractResult = await createContractAPI({
            id: requestId!, // make sure requestId exists
            policy: updatedRequest.policy,
          });
          console.log("Contract created successfully:", contractResult);

          // Update Firebase with contractId
          if (contractResult.contract_id) {
            await updateRequest(requestId!, {
              contractId: contractResult.contract_id,
            });

            // Update local state with contractId too
            setRequestDetails((prev) =>
              prev ? { ...prev, contractId: contractResult.contract_id } : prev
            );
          }
        } catch (contractError) {
          console.error("Error creating contract:", contractError);
        }
        console.log("user comes from: ", user.loginSource);
        console.log("number of requests is: ", userRequestsCount);

        // Notify parent window if in iframe mode
        console.log("🔍 Accept - isIframeMode:", isIframeMode);
        if (isIframeMode) {
          console.log("📡 Notifying parent window about approval");
          notifyParent({
            action: "request_accepted",
            requestId: requestId,
            requestName: requestDetails.requestName,
          });
        }

        // Navigate based on context
        if (!isIframeMode) {
          // If not in iframe, navigate to dashboard
          navigate("/ownerBase/ownerDashboard");
        }
        // If in iframe with multiple requests, don't navigate (stay on current page)
      } else {
        setError("Error accepting request.");
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      setError("Error accepting request.");
    }
    setUpdating(false);
  };

  // Function to close Bootstrap modal manually
  const closeModal = (modalId: string) => {
    const modal = document.getElementById(modalId) as any;
    if (modal) {
      modal.classList.remove("show");
      document.body.classList.remove("modal-open");
      document.getElementsByClassName("modal-backdrop")[0]?.remove();
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-danger">{error}</div>;
  if (!requestDetails) return <div>No request details found.</div>;

  return (
    <>
      <div
        className={`${styles.dashboard} container w-50`}
        style={isIframeMode ? { marginTop: "20px" } : {}}
      >
        {!isIframeMode && (
          <Link
            className="text-decoration-none"
            to="/ownerBase/ownerPendingRequests"
            role="button"
          >
            <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
          </Link>
        )}
        <h3 className={isIframeMode ? "mt-2" : "mt-4"}>
          {requestDetails.requestName}
        </h3>
        {/* <h1>
          Provider Mongo ID: {user?.userData?.mongoUserId ?? "Not available"},
          {user?.uid}
        </h1> */}

        <h5 className="mt-4 mb-3">Requester details</h5>
        <p>
          <i className="fa-solid fa-user me-3"></i>
          {requestDetails.requester.requesterName}
        </p>
        <p className="mb-4">
          <i className="fa-solid fa-envelope me-3"></i>
          {requestDetails.requester.requesterEmail}
        </p>

        {(() => {
          // Parse permissions from ODRL policy or fallback to legacy permissions
          const parsedPermissions = getRequestPermissions(requestDetails);

          return parsedPermissions.map((permission, ruleIndex) => (
            <div key={ruleIndex} className="mb-4 mt-4">
              <h5>Permission {ruleIndex + 1}</h5>
              <h5 className="mt-4">What’s being requested</h5>
              <p>
                <strong>Dataset:</strong> The requester wants access to data
                from <strong>{permission.dataset}</strong>.
              </p>
              <p>
                <strong>Action:</strong> The requester wants to{" "}
                <strong>{permission.action}</strong> to this dataset.
              </p>

              <p>
                <strong>Purpose:</strong> This request is for{" "}
                <strong>{formatOperand(permission.purpose)}</strong> reasons.
              </p>

              {/* Show generic ODRL constraints */}
              {permission.constraints && permission.constraints.length > 0 && (
                <div className="mt-3">
                  <h6>Policy Constraints:</h6>
                  <ul className="list-unstyled ms-3">
                    {permission.constraints.map((constraint, i) => (
                      <li key={i} className="mb-1">
                        <small className="text-muted">
                          • {formatOperand(constraint.leftOperand)}{" "}
                          {formatOperand(constraint.operator)}{" "}
                          {formatOperand(constraint.rightOperand)}
                        </small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Show generic ODRL assignees */}
              {permission.assignees && permission.assignees.length > 0 && (
                <div className="mt-3">
                  <h6>Assigned To:</h6>
                  {permission.assignees.map((assignee, i) => (
                    <div key={i} className="ms-3">
                      <p className="mb-1">
                        <strong>{assignee.source}</strong>
                      </p>
                      {assignee.refinements &&
                        assignee.refinements.map((ref, j) => (
                          <p key={j} className="mb-1 ms-2">
                            <small className="text-muted">
                              └ {ref.description}
                            </small>
                          </p>
                        ))}
                    </div>
                  ))}
                </div>
              )}

              {permission.datasetRefinements?.length > 0 && (
                <div>
                  <h5>Dataset conditions:</h5>
                  <ul className="list-unstyled">
                    {permission.datasetRefinements.map((ref, i) => (
                      <li key={i}>
                        Data about <strong>{ref.attribute}</strong> items
                        greater than <strong>{ref.value}</strong>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {permission.actionRefinements?.length > 0 && (
                <div>
                  <h5>Action conditions:</h5>
                  <ul className="list-unstyled">
                    {permission.actionRefinements.map((ref, i) => (
                      <li key={i}>
                        Write access to <strong>{ref.attribute}</strong> items
                        greater than <strong> {ref.value}</strong>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {permission.purposeRefinements?.length > 0 && (
                <div>
                  <h5>Purpose conditions:</h5>
                  <ul className="list-unstyled">
                    {permission.purposeRefinements.map((ref, i) => (
                      <li key={i}>
                        Data will be used for <strong>{ref.attribute}</strong>{" "}
                        items greater than <strong>{ref.value}</strong>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {permission.constraintRefinements?.length > 0 && (
                <div>
                  <h5>Constraints:</h5>
                  <ul className="list-unstyled">
                    {permission.constraintRefinements.map((ref, i) => (
                      <li key={i}>
                        Data should meet the constraint:{" "}
                        <strong>{ref.attribute}</strong> {ref.instance}{" "}
                        <strong>{ref.value}</strong>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ));
        })()}

        <div className="alert alert-warning" role="alert">
          If you are unsure whether to accept, reject or negotiate the request,
          please contact the data provider.
        </div>

        {/* Show negotiation info if exists */}
        {negotiationInfo && (
          <div className="alert alert-info" role="alert">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Negotiation Available</strong>
                <br />
                <small>
                  This consent request has an associated negotiation (ID:{" "}
                  {negotiationInfo.negotiationId})
                </small>
              </div>
              {!isIframeMode && (
                <button
                  className={`${styles.secondaryButton} btn`}
                  onClick={viewNegotiation}
                  disabled={checkingNegotiation}
                >
                  {checkingNegotiation ? "Loading..." : "View Negotiation"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hide buttons in iframe mode if negotiation exists (user will be auto-redirected) */}
        {!negotiationInfo && (
          <div className="d-flex mt-4">
            <div>
              <button
                className={`${styles.primaryButton} btn`}
                data-bs-toggle="modal"
                data-bs-target="#acceptRequestModal"
              >
                Accept
              </button>
            </div>
            <div className="ms-3">
              <button
                className={`${styles.secondaryButton} btn`}
                data-bs-toggle="modal"
                data-bs-target="#negotiateRequestModal"
                disabled={updating}
              >
                {updating ? "Processing..." : "Negotiate"}
              </button>
            </div>

            <div className="ms-auto">
              <button
                className={`${styles.dangerButton} btn`}
                data-bs-toggle="modal"
                data-bs-target="#rejectRequestModal"
                disabled={updating}
              >
                {updating ? "Processing..." : "Reject"}
              </button>
            </div>
          </div>
        )}

        {/* Show loading message in iframe mode when negotiation exists */}
        {isIframeMode && negotiationInfo && (
          <div className="text-center mt-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Opening negotiation dashboard...</p>
            <small className="text-muted">This will open in a new tab</small>
            <div className="mt-3">
              <p className="text-muted small">
                <i className="fa-solid fa-circle-info me-1"></i>
                If the tab doesn't open, please check your browser's pop-up
                blocker
              </p>
              <button
                className={`${styles.primaryButton} btn btn-sm mt-2`}
                onClick={viewNegotiation}
                disabled={checkingNegotiation}
              >
                {checkingNegotiation
                  ? "Opening..."
                  : "Open Negotiation Manually"}
              </button>
            </div>
          </div>
        )}

        {isIframeMode && <div style={{ height: "30px" }}></div>}
      </div>

      {/* Approval Confirmation Modal */}
      <div
        className="modal fade"
        id="acceptRequestModal"
        tabIndex={-1}
        aria-labelledby="acceptModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Acceptance Confirmation</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              Are you sure you want to approve this request?
            </div>
            <div className="modal-footer">
              <button
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                className={`${styles.primaryButton} btn`}
                onClick={acceptRequest}
                disabled={updating}
              >
                {updating ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Negotiation Confirmation Modal */}
      <div
        className="modal fade"
        id="negotiateRequestModal"
        tabIndex={-1}
        aria-labelledby="negotiateModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Disclaimer</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              This action will redirect you to the negotiation plugin.
            </div>
            <div className="modal-footer">
              <button
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                className={`${styles.primaryButton} btn`}
                onClick={negotiateRequest}
                disabled={updating}
              >
                {updating ? "Redirecting..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Confirmation Modal */}
      <div
        className="modal fade"
        id="rejectRequestModal"
        tabIndex={-1}
        aria-labelledby="rejectRequestModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Rejection</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to reject this request?</p>
            </div>
            <div className="modal-footer">
              <button
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                className={`${styles.dangerButton} btn`}
                onClick={rejectRequest}
                disabled={updating}
              >
                {updating ? "Rejecting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default OwnerPendingRequestsDetails;
