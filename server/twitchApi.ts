import getLogger from "../logger";

import { AxiosResponse, default as axios } from "axios";
const logger = getLogger("TwitchAPI");
import * as auth from "./auth";
import Sentry from "@sentry/node";

export function setTitle(title: string, callback: Function) {
  auth.getAccessTokenByName(
    process.env.CHANNEL as string,
    (access_token: string) => {
      if (access_token == null) {
        callback(false);
        return;
      }
      auth.getUserIdByName(process.env.CHANNEL as string, (userId: number) => {
        axios
          .patch(
            `https://api.twitch.tv/helix/channels?broadcaster_id=${userId}`,
            { title: title },
            {
              headers: {
                Authorization: "Bearer " + access_token,
                "Client-Id": process.env.TWITCH_CLIENT_ID,
                "Content-Type": "application/json",
              },
            }
          )
          .catch((error: object) => {
            logger.error({ error: error }, "Changing title was not successful");
            Sentry.captureException(error);
            callback(false);
            return;
          })
          .then((res: void | AxiosResponse) => {
            callback(true);
          });
      });
    }
  );
}

export function setGame(search: string, callback: Function) {
  auth.getAccessTokenByName(
    process.env.CHANNEL as string,
    (access_token: string) => {
      axios
        .get(
          `https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(
            search
          )}&first=1`,
          {
            headers: {
              Authorization: "Bearer " + access_token,
              "Client-Id": process.env.TWITCH_CLIENT_ID,
            },
          }
        )
        .catch((error: object) => {
          logger.error({ error: error }, "Searching for Category failed.");
          Sentry.captureException(error);
          callback(false);
          return;
        })
        .then((searchResult: void | AxiosResponse) => {
          if (!searchResult) {
            callback(false);
            return;
          }
          logger.debug(searchResult.data.data, "Found list of games");
          if (searchResult.data.data.length == 0) {
            callback(false);
            return;
          }
          let gameId = searchResult.data.data[0].id;
          let gameName = searchResult.data.data[0].name;

          auth.getUserIdByName(
            process.env.CHANNEL as string,
            (userId: number) => {
              axios
                .patch(
                  `https://api.twitch.tv/helix/channels?broadcaster_id=${userId}`,
                  { game_id: gameId },
                  {
                    headers: {
                      Authorization: "Bearer " + access_token,
                      "Client-Id": process.env.TWITCH_CLIENT_ID,
                      "Content-Type": "application/json",
                    },
                  }
                )
                .catch((error: object) => {
                  logger.error(error, "Changing Category was not successful");
                  Sentry.captureException(error);
                  callback(false);
                  return;
                })
                .then((res: void | AxiosResponse) => {
                  callback(true, gameName);
                });
            }
          );
        });
    }
  );
}

export function getActiveStreamByName(username: string, callback: Function) {
  auth.getSystemAuth((access_token: string) => {
    axios
      .get(
        `https://api.twitch.tv/helix/streams?user_login=${username}&first=1`,
        {
          headers: {
            Authorization: "Bearer " + access_token,
            "Client-Id": process.env.TWITCH_CLIENT_ID,
          },
        }
      )
      .catch((error: object) => {
        Sentry.captureException(error);
        logger.error({ error: error }, "Could not get active stream");
        callback(null);
        return;
      })
      .then((result: void | AxiosResponse) => {
        if (!result || result.data.data.length == 0) {
          callback(null);
          return;
        }
        callback(result.data.data[0]);
      });
  });
}

export function getLastPlayedName(username: string, callback: Function) {
  auth.getSystemAuth((app_access_token: string) => {
    auth.getUserIdByName(username, (user_Id: number) => {
      if (!user_Id) {
        callback(user_Id);
        return;
      }
      axios
        .get(`https://api.twitch.tv/helix/channels?broadcaster_id=${user_Id}`, {
          headers: {
            Authorization: "Bearer " + app_access_token,
            "Client-Id": process.env.TWITCH_CLIENT_ID,
          },
        })
        .then((result: { data: { data: Array<{ game_name: string }> } }) => {
          if (!result.data.data[0].game_name) {
            callback("");
            return;
          }
          callback(result.data.data[0].game_name);
          return;
        })
        .catch((error: object) => {
          Sentry.captureException(error);
          logger.error({ error: error }, "Could not get last Game");
          callback(null);
          return;
        });
    });
  });
}

export function createClip(username: string, callback: Function) {
  auth.getAccessTokenByName(username, (access_token: string) => {
    auth.getUserIdByName(username, (user_id: number) => {
      axios
        .post(
          `https://api.twitch.tv/helix/clips?broadcaster_id=${user_id}`,
          null,
          {
            headers: {
              Authorization: "Bearer " + access_token,
              "Client-Id": process.env.TWITCH_CLIENT_ID,
            },
          }
        )
        .then((result: { data: { data: Array<{ id: number }> } }) => {
          setTimeout(() => {
            getCreatedClip(result.data.data[0].id, (clip_link: string) => {
              callback(clip_link);
            });
          }, 15000);
        })
        .catch((error: { response: { status: number } }) => {
          if (error.response.status === 404) {
            logger.warn(error, "Tried creating clip while offline");
            callback(null);
            return;
          }
          Sentry.captureException(error);
          logger.error({ error: error }, "Could not create clip");
          callback(null);
          return;
        });
    });
  });
}

function getCreatedClip(clip_id: number, callback: Function) {
  auth.getSystemAuth((app_access_token: string) => {
    axios
      .get(`https://api.twitch.tv/helix/clips?id=${clip_id}`, {
        headers: {
          Authorization: "Bearer " + app_access_token,
          "Client-Id": process.env.TWITCH_CLIENT_ID,
        },
      })
      .then((result: { data: { data: Array<{ url: string }> } }) => {
        if (result.data.data.length == 0) {
          callback("");
          return;
        }
        callback(result.data.data[0].url);
        return;
      })
      .catch((error: object) => {
        Sentry.captureException(error);
        logger.error({ error: error }, "Could not get clip");
        callback(null);
        return;
      });
  });
}
