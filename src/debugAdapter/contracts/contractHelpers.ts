// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import Compiler from '@truffle/workflow-compile';
import {Compilations} from '@truffle/codec';
import path from 'path';
import {Source} from '@truffle/compile-common';
import TruffleConfig from '@truffle/config';

/**
 * Represents the return from the compilation of contracts.
 */
export type ContractData = {
  /**
   * A list of mapped files so debug can open.
   */
  mappedSources: Map<string, string>;
  /**
   * A list of Compilations (shim) generated by the truffle compiler.
   */
  shimCompilations: Array<Compilations.Compilation>;
};

/**
 * This function compiles all contracts and returns an object with
 * mapped file sources and builds (shim).
 *
 * @param config The truffle configuration file.
 * @returns A object (ContractData) Environmentwith the mapped source files and
 * the contract compilations (shim).
 */
export async function prepareContracts(config: TruffleConfig): Promise<ContractData> {
  // Sets the properties for the compilation
  config.all = true;
  config.quiet = true;

  // Compiles the contracts and convert it on shim
  const {compilations} = await Compiler.compile(config);
  const shimCompilations = Compilations.Utils.shimCompilations(compilations);

  // Retrieves sources path so the debug can open them
  const mappedSources = await getContractSourcePath(config.working_directory, compilations[0].sources);

  // Return the ContractData object
  return {
    mappedSources,
    shimCompilations,
  };
}

/**
 * This function creates the file map and finds where the files are.
 * There are references to modules within NPM, so we need to map them.
 *
 * @param workingDirectory The workspace path where the truffle project is located.
 * @param sources The list of contracts.
 * @returns A object (Map) with the mapped source files.
 */
async function getContractSourcePath(workingDirectory: string, sources: Source[]): Promise<Map<string, string>> {
  const mappedSources = new Map<string, string>();

  // Reads all contracts
  await Promise.all(
    Object.values(sources).map(async (source) => {
      // Gets the absolute path from the source file
      const absolutePathKey = 'absolutePath' as keyof typeof source.ast;
      const absolutePathValue = source.ast![absolutePathKey] as string;

      // Checks if the file origin (project or node modules)
      if (absolutePathValue.startsWith('project:/')) {
        mappedSources.set(source.sourcePath, source.sourcePath);
      } else {
        mappedSources.set(source.sourcePath, path.join(workingDirectory, 'node_modules', absolutePathValue));
      }
    })
  );

  // returns a map object
  return mappedSources;
}
