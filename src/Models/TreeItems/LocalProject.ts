// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from "../../Constants";
import {IDeployDestination} from "../IDeployDestination";
import {ItemType} from "../ItemType";
import {LocalNetworkNode} from "./LocalNetworkNode";
import {Project} from "./Project";

export class LocalProject extends Project {
  public readonly port: number;
  public readonly forked?: boolean;

  constructor(label: string, port: number, forked?: boolean, description?: string) {
    super(ItemType.LOCAL_PROJECT, label, Constants.treeItemData.project.local, description);

    this.port = port;
    this.forked = forked;
  }

  public toJSON(): {[p: string]: any} {
    const obj = super.toJSON();

    obj.port = this.port;
    obj.forked = this.forked;

    return obj;
  }

  public async getDeployDestinations(): Promise<IDeployDestination[]> {
    const {local} = Constants.treeItemData.service;

    const getDeployName = (labelNode: string) => [local.prefix, this.label, labelNode].join("_");

    return Promise.all(
      (this.getChildren() as LocalNetworkNode[]).map(async (node) => {
        return {
          description: await node.getRPCAddress(),
          detail: local.label,
          getTruffleNetwork: async () => {
            const truffleNetwork = await node.getTruffleNetwork();
            truffleNetwork.name = getDeployName(node.label);
            return truffleNetwork;
          },
          label: getDeployName(node.label),
          networkId: node.networkId,
          networkType: node.itemType,
          port: node.port,
        } as IDeployDestination;
      })
    );
  }
}
