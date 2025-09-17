import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { useIframe } from "../../IframeContext";
import {
  getRequest,
  getNegotiationByRequestId,
  redirectToNegotiationDisplay,
} from "../../services/api";
import { getRequestPermissions } from "../../utils/policyParser";

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

function OwnerOtherRequestsDetails() {
  const { requestId } = useParams<{ requestId: string }>();
  const { isIframeMode, notifyParent } = useIframe();
  const [requestDetails, setRequestDetails] = useState<Request | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [updating] = useState<boolean>(false);
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
              if (isIframeMode && !autoRedirectAttempted) {
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
              const userType = user.role === "owner" ? "provider" : "consumer";

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

                await redirectToNegotiationDisplay(
                  negotiationInfo.negotiationId,
                  accessToken,
                  user.userData.mongoUserId,
                  userType
                );
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
            to="/ownerBase/ownerOtherRequests"
            role="button"
          >
            <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
          </Link>
        )}
        <h3 className={isIframeMode ? "mt-2" : "mt-4"}>
          {requestDetails.requestName}
        </h3>

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
                <strong>{permission.purpose}</strong> reasons.
              </p>

              {/* Show generic ODRL constraints */}
              {permission.constraints && permission.constraints.length > 0 && (
                <div className="mt-3">
                  <h6>Policy Constraints:</h6>
                  <ul className="list-unstyled ms-3">
                    {permission.constraints.map((constraint, i) => (
                      <li key={i} className="mb-1">
                        <small className="text-muted">
                          • {constraint.description}
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
        {/* Hide buttons in iframe mode if negotiation exists 
    OR if the request is already rejected */}
        {!negotiationInfo && requestDetails.status !== "rejected" && (
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
    </>
  );
}

export default OwnerOtherRequestsDetails;
