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
  getOntologies,
} from "../../services/api";
import log from "loglevel";

log.setLevel("debug");
import { Request } from "../Interfaces/Requests";

// css
import styles from "../../css/Ontology.module.css";

// components
import LoadingSpinner from "../LoadingSpinner";
import renderPermissions from "../../utils/renderPermissions";
import { useTranslation } from "react-i18next";
import { getAttributeDropdownValue, getFeatureDropdownValue, loadGraph } from "../../helperFunctions/RequestDropdowns";

function OwnerPendingRequestDetails() {
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
  const { t, i18n } = useTranslation();
  const [labels, setLabels] = useState<any>();

  useEffect(() => {
      const loadDropdownValues = async () => {
        let ontologies = await getOntologies();
        if (requestDetails?.selectedOntologies) {
          ontologies = ontologies.concat(requestDetails.selectedOntologies);
          const store = await loadGraph(ontologies);
          const actions = await getFeatureDropdownValue(
            store,
            "action"
          );
          const purposes = await getFeatureDropdownValue(
            store,
            "purpose"
          );
          // NOTE: Currently, we load all left operands for all refinements. In the future, we might want to retrieve left operands that are valid with respect to the current ODRL element.
          const refinements = await getAttributeDropdownValue(store);
          const labels = actions.concat(purposes).concat(refinements);
          setLabels(labels);
        }
      };
      loadDropdownValues();
    },[requestDetails, i18n.language]);

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
            user.userData?.uid
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
                user.uid,
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
          const providerMongoId = user.uid;

          if (providerMongoId) {
            if (!user) {
              console.error("User not authenticated, cannot fetch requester");
              return;
            }

            console.log("Using UID from useAuth:", user.uid);

            const consumerId = requestDetails.requester.requesterId;

            console.log("Creating new accepted negotiation...", {
              consumerId,
              providerId: providerMongoId,
            });

            try {
              console.log("=== STARTING FRONTEND NEGOTIATION CREATION ===");
              console.log("Request details for negotiation:", {
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

              // Handle case where apiToken might be a JSON string containing access_token
              if (
                typeof negotiationToken === "string" &&
                negotiationToken.startsWith("{")
              ) {
                try {
                  const parsed = JSON.parse(negotiationToken);
                  negotiationToken = parsed.access_token || negotiationToken;
                  console.log("Extracted access_token from apiToken JSON");
                } catch (e) {
                  console.warn(
                    "Could not parse apiToken JSON, using raw value"
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
                    "negotiationToken is not a string and has no access_token:",
                    negotiationToken
                  );
                  negotiationToken = undefined;
                }
              }

              if (!negotiationToken) {
                console.warn(
                  "No provider token in AuthContext, falling back to localStorage"
                );

                const fallbackToken = localStorage.getItem("token");

                if (fallbackToken && fallbackToken.startsWith("{")) {
                  try {
                    const parsed = JSON.parse(fallbackToken);
                    negotiationToken = parsed.access_token || undefined;
                    console.log(
                      "Extracted access_token from localStorage JSON"
                    );
                  } catch (e) {
                    console.warn(
                      "Could not parse fallback token JSON, using raw value"
                    );
                    negotiationToken = fallbackToken;
                  }
                } else {
                  negotiationToken = fallbackToken || undefined;
                }

                console.log("Fallback token check:", {
                  hasFallbackToken: !!negotiationToken,
                  fallbackTokenLength: negotiationToken?.length || 0,
                });

                if (!negotiationToken) {
                  throw new Error("No authentication token found for provider");
                }
              }

              console.log("Auth token is: ", negotiationToken);
              console.log(
                "Making API call to createAcceptedNegotiationFromRequest..."
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

              console.log("Negotiation creation API response:", {
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
                  "Accepted negotiation created successfully:",
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
                    console.log("Redirecting with:", {
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
                        "Notifying parent window about negotiation"
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
                      "Missing negotiation ID or MongoDB user ID for redirect"
                    );
                  }
                }
              } else {
                console.warn(
                  "Failed to create accepted negotiation:",
                  negotiationResult.error
                );
                // Continue with approval process even if negotiation creation fails
              }
            } catch (negotiationError) {
              console.warn(
                "Error creating accepted negotiation:",
                negotiationError
              );
              // Continue with approval process even if negotiation creation fails
            }
          } else {
            console.warn(
              "Cannot create negotiation without provider mongoDB ID. Continuing with approval."
            );
          }
        }
      } else {
        console.warn("No requester info available for negotiation creation");
      }

      console.log("Closing modal and finalizing approval...");
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
        console.log("Navigating to dashboard");
        navigate("/ownerBase/ownerDashboard");
      }
    } catch (error) {
      console.error("Error in approval process:", error);
      setError("Error approving request.");
    }

    console.log("Approval process completed, setting updating to false");
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
    log.info("upconsent/src/components/Owner/OwnerPendingRequestDetails.tsx ");
    log.info("user info", user);

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
          // policy: we must get a policy object here.
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
            user: user, // added user here
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
          // If something goes wrong, we revert the request to its previous state.
          await updateRequest(requestId!, requestDetails);
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
  if (!requestDetails) return <div>{t("no_request_details_found")}</div>;

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
            <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;{t("back")}
          </Link>
        )}
        <h3 className={isIframeMode ? "mt-2" : "mt-4"}>
          {requestDetails.requestName}
        </h3>
        <h5 className="mt-4 mb-3">{t("requester_details")}</h5>
        <p>
          <i className="fa-solid fa-user me-3"></i>
          {requestDetails.requester.requesterName}
        </p>
        <p className="mb-4">
          <i className="fa-solid fa-envelope me-3"></i>
          {requestDetails.requester.requesterEmail}
        </p>

        <text>
          {requestDetails.extraText ? requestDetails.extraText : ""}
        </text>

        {renderPermissions(requestDetails, t, labels)}

        <div className="alert alert-warning" role="alert">
          {t("pending_request_disclaimer")}
        </div>

        {/* Show negotiation info if exists */}
        {negotiationInfo && (
          <div className="alert alert-info" role="alert">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{t("negotiation_available")}</strong>
                <br />
                <small>
                  {t("negotiation_available_text_1")} (ID:{" "}
                  {negotiationInfo.negotiationId})
                </small>
              </div>
              {!isIframeMode && (
                <button
                  className={`${styles.secondaryButton} btn`}
                  onClick={viewNegotiation}
                  disabled={checkingNegotiation}
                >
                  {checkingNegotiation ? `${t("loading")}...` : t("view_negotiation")}
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
                {t("accept")}
              </button>
            </div>
            <div className="ms-3">
              <button
                className={`${styles.secondaryButton} btn`}
                data-bs-toggle="modal"
                data-bs-target="#negotiateRequestModal"
                disabled={updating}
              >
                {updating ? `${t("processing")}...` : t("negotiate")}
              </button>
            </div>

            <div className="ms-auto">
              <button
                className={`${styles.dangerButton} btn`}
                data-bs-toggle="modal"
                data-bs-target="#rejectRequestModal"
                disabled={updating}
              >
                {updating ? `${t("processing")}...` : t("reject")}
              </button>
            </div>
          </div>
        )}

        {/* Show loading message in iframe mode when negotiation exists */}
        {isIframeMode && negotiationInfo && (
          <div className="text-center mt-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t("loading")}...</span>
            </div>
            <p className="mt-2">{t("opening_negotiation_dashboard")}...</p>
            <small className="text-muted">{t("this_will_open_a_new_tab")}</small>
            <div className="mt-3">
              <p className="text-muted small">
                <i className="fa-solid fa-circle-info me-1"></i>
                {t("new_tab_troubleshoot")}
              </p>
              <button
                className={`${styles.primaryButton} btn btn-sm mt-2`}
                onClick={viewNegotiation}
                disabled={checkingNegotiation}
              >
                {checkingNegotiation
                  ? `${t("opening")}...`
                  : t("opening_negotiation_manually")}
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
              <h5 className="modal-title">{t("acceptance_confirmation")}</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              {t("acceptance_confirmation_text_1")}
            </div>
            <div className="modal-footer">
              <button
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                {t("cancel")}
              </button>
              <button
                className={`${styles.primaryButton} btn`}
                onClick={acceptRequest}
                disabled={updating}
              >
                {updating ? `${t("approving")}...` : t("approve")}
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
              <h5 className="modal-title">{t("disclaimer")}</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              {t("redirect_to_negotiation_plugin")}
            </div>
            <div className="modal-footer">
              <button
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                {t("cancel")}
              </button>
              <button
                className={`${styles.primaryButton} btn`}
                onClick={negotiateRequest}
                disabled={updating}
              >
                {updating ? `${t("redirecting")}...` : t("continue")}
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
              <h5 className="modal-title">{t("confirm_rejection")}</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              <p>{t("confirm_rejection_text_1")}</p>
            </div>
            <div className="modal-footer">
              <button
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                {t("cancel")}
              </button>
              <button
                className={`${styles.dangerButton} btn`}
                onClick={rejectRequest}
                disabled={updating}
              >
                {updating ? `${t("rejecting")}...` : t("confirm")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default OwnerPendingRequestDetails;
